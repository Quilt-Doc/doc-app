const { spawnSync } = require('child_process');
const fs = require('fs');
const lineByLine = require('n-readlines');

const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

const { fetchAllPRsFromDB } = require("../github/pr_utils");

const InsertHunk = require("../../../models/InsertHunk");

const Sentry = require("@sentry/node");






const generateAllCommitsDiffFile = (repoDiskPath, repositoryId) => {

    var timestamp = Date.now().toString();

    try {
        const diffGenerate = spawnSync('../../generate_all_commit_diffs.sh', [`../${timestamp}-${repositoryId}.patch`], {cwd: repoDiskPath});
    }
    catch(err) {

        Sentry.setContext("scanRepositories", {
            message: `generateAllCommitDiffs error occurred trying to run '../generate_all_commit_diffs.sh'`,
            outputFilePath: `../${timestamp}.patch`,
            cwd: repoDiskPath,
        });

        Sentry.captureException(err);
        
        console.log(err);

        throw err;
    }
    return `./git_repos/${timestamp}-${repositoryId}.patch`;
}

const deleteRepositoryDiffFile = (diffFilePath) => {

    try {
        const diffGenerate = spawnSync('rm', [`${diffFilePath}`]);
    }
    catch(err) {

        Sentry.setContext("scanRepositories", {
            message: `generateAllCommitDiffs error occurred trying to delete diff file`,
            filePath: `${diffFilePath}`,
        });

        Sentry.captureException(err);
        
        console.log(err);

        throw err;
    }

}


const createBlamesFromPatchFile = (patchFilePath, repositoryId) => {

    const liner = new lineByLine(patchFilePath);

    var allRegions = [];
 
    let line;

    // Ordered by hierarchy, broadest to most specific
    var currentCommitSha = "";
    var currentFilePath = "";

    var currentNewRegion = [];
    var currentNewRegionLineStart = -1;

    var regionIsExpanding = false;

    var currentLineNumber = -1;

    var print_idx = 0;

    while (line = liner.next()) {

        line = line.toString("ascii");

        // New Commit section reached
        if (line.includes("New Commit: ")) {

            // Handle end of any regions being built until this point
            if (currentNewRegion.length > 0) {
                allRegions.push({   commitSha: currentCommitSha,
                        filePath: currentFilePath,
                        lineStart: currentNewRegionLineStart,
                        lines: currentNewRegion
                    });
                currentNewRegion = [];
            }

            currentCommitSha = line.replace("New Commit: ", "");
            if (print_idx % 10 == 0) {
                console.log("currentCommitSha: ", currentCommitSha);
            }

            currentLineNumber = -1;
        }

        // If we are on the line where the full 'diff' command is displayed
        else if (line.substring(0, 4).includes("diff")) {

            // Handle end of any regions being built until this point
            if (currentNewRegion.length > 0) {
                allRegions.push({   commitSha: currentCommitSha,
                        filePath: currentFilePath,
                        lineStart: currentNewRegionLineStart,
                        lines: currentNewRegion
                    });
                currentNewRegion = [];
            }
            continue;
        }
        // If we are on the line containing 'b/file_path', parse and get the relevant file path
        else if (line.substring(0, 3).includes("+++")) {
            currentFilePath = line.split(" ")[1].replace("b/", "");

            // Commit that updated arby_log_handler.py
            
            if (currentCommitSha == "f29d074c5919dcf1768fcea3215b2af6463158dd") {
                console.log("currentFilePath: ", currentFilePath);
            }
            // console.log("currentFilePath: ", currentFilePath);
        }

        // New hunk header
        else if (line.substring(0, 2).includes("@@")) {

            // Handle end of any regions being built until this point
            if (currentNewRegion.length > 0) {
                allRegions.push({   commitSha: currentCommitSha,
                        filePath: currentFilePath,
                        lineStart: currentNewRegionLineStart,
                        lines: currentNewRegion
                    });
                currentNewRegion = [];
            }


            // Get hunk header without any suffixes "@@ -1,13 +3,34 @@"
            var endIndex = line.substring(2,line.length).indexOf("@@") + 2;
            var hunkHeader = line.substring(0, endIndex + 2);

            var startingLineNum = hunkHeader.split(" ")[2].split(",")[0].replace("+", "");

            // console.log("hunkHeader: ", hunkHeader);
            // console.log("startingLineNum: ", startingLineNum);

            // Substract one since the first line is actually 'startingLineNum' and will be incremented by one
            currentLineNumber = startingLineNum - 1;

            if (currentCommitSha == "f29d074c5919dcf1768fcea3215b2af6463158dd" && currentFilePath == "arby_log_handler.py") {
                console.log("currentLineNumber: ", currentLineNumber);
            }

        }

        // Line that is same between both file versions
        else if (line[0] == " ") {
            
            // Handle end of any regions being built until this point
            if (currentNewRegion.length > 0) {
                allRegions.push({   commitSha: currentCommitSha,
                        filePath: currentFilePath,
                        lineStart: currentNewRegionLineStart,
                        lines: currentNewRegion
                    });
                currentNewRegion = [];
            }

            currentLineNumber += 1;
        }

        // Line that is removed by the commit
        else if (line[0] == "-") {
            // Continue, don't increment currentLineNumber, don't end region as only similar regions can break currently building regions
            continue;
        }

        // Line that is added by the commmit, add to currentNewRegion
        else if (line[0] == "+") {
            if (currentNewRegion.length == 0) {
                currentNewRegionLineStart = currentLineNumber;
            }
            // if (line.replace("+", "").length > 0) {
                currentNewRegion.push(line.replace("+", ""));
            // }
            currentLineNumber += 1;
        }
        /*
        if (currentCommitSha == "f29d074c5919dcf1768fcea3215b2af6463158dd" && currentFilePath == "arby_log_handler.py") {
            console.log("currentNewRegion.length: ", currentNewRegion.length);
        }
        */
        print_idx += 1;
    }

    // Handle end of any regions being built until this point
    if (currentNewRegion.length > 0) {
        allRegions.push({   commitSha: currentCommitSha,
                filePath: currentFilePath,
                lineStart: currentNewRegionLineStart,
                lines: currentNewRegion
            });
        currentNewRegion = [];
    }

    allRegions = allRegions.map(regionObj => {
        return Object.assign({}, { repository: repositoryId.toString() }, regionObj)
    });

    return allRegions;

}


const getPRDiffContent = async (installationClient, repositoryFullName, prNumber) => {

    var prDiffResponse;
    try {
        prDiffResponse = await installationClient.get(`/repos/${repositoryFullName}/pulls/${prNumber}`,
                                                        { headers: {"Content-Type": "application/vnd.github.v3.diff",
                                                                    accept: "application/vnd.github.v3.diff",} 
                                                        }
                                                    );
    }
    catch (err) {
        console.log(err);

        Sentry.setContext("getPRDiffContnet", {
            message: `Error occurred fetching PR diff`,
            repositoryFullName: repositoryFullName,
            prNumber: prNumber,
        });

        Sentry.captureException(err);

        throw err;
    }
    return prDiffResponse.data;
}


const createBlamesFromPRPatch = (prPatchContent, prNumber, repositoryId) => {

    // console.log("createBlamesFromPRPatch - prPatchContent: ");
    // console.log(prPatchContent);

    var prPatchLines = prPatchContent.split("\n");

    var allRegions = [];

    // Ordered by hierarchy, broadest to most specific
    var currentFilePath = "";

    var currentNewRegion = [];
    var currentNewRegionLineStart = -1;

    var currentLineNumber = -1;

    var line;
    var i = 0;

    for ( i = 0; i < prPatchLines.length; i++ ) {

        line = prPatchLines[i];

        line = line.toString("ascii");

        // If we are on the line where the full 'diff' command is displayed
        if (line.substring(0, 4).includes("diff")) {

            // Handle end of any regions being built until this point
            if (currentNewRegion.length > 0) {
                allRegions.push({   filePath: currentFilePath,
                        lineStart: currentNewRegionLineStart,
                        lines: currentNewRegion
                    });
                currentNewRegion = [];
            }
            continue;
        }
        // If we are on the line containing 'b/file_path', parse and get the relevant file path
        else if (line.substring(0, 3).includes("+++")) {
            currentFilePath = line.split(" ")[1].replace("b/", "");

            // console.log("currentFilePath: ", currentFilePath);
        }

        // New hunk header
        else if (line.substring(0, 2).includes("@@")) {

            // Handle end of any regions being built until this point
            if (currentNewRegion.length > 0) {
                allRegions.push({   filePath: currentFilePath,
                        lineStart: currentNewRegionLineStart,
                        lines: currentNewRegion
                    });
                currentNewRegion = [];
            }


            // Get hunk header without any suffixes "@@ -1,13 +3,34 @@"
            var endIndex = line.substring(2,line.length).indexOf("@@") + 2;
            var hunkHeader = line.substring(0, endIndex + 2);

            var startingLineNum = hunkHeader.split(" ")[2].split(",")[0].replace("+", "");

            // console.log("hunkHeader: ", hunkHeader);
            // console.log("startingLineNum: ", startingLineNum);

            // Substract one since the first line is actually 'startingLineNum' and will be incremented by one
            currentLineNumber = startingLineNum - 1;


        }

        // Line that is same between both file versions
        else if (line[0] == " ") {
            
            // Handle end of any regions being built until this point
            if (currentNewRegion.length > 0) {
                allRegions.push({   filePath: currentFilePath,
                        lineStart: currentNewRegionLineStart,
                        lines: currentNewRegion
                    });
                currentNewRegion = [];
            }

            currentLineNumber += 1;
        }

        // Line that is removed by the commit
        else if (line[0] == "-") {
            // Continue, don't increment currentLineNumber, don't end region as only similar regions can break currently building regions
            continue;
        }

        // Line that is added by the commmit, add to currentNewRegion
        else if (line[0] == "+") {
            if (currentNewRegion.length == 0) {
                currentNewRegionLineStart = currentLineNumber;
            }
            // if (line.replace("+", "").length > 0) {
                currentNewRegion.push(line.replace("+", ""));
            // }
            currentLineNumber += 1;
        }
    }

    // Handle end of any regions being built until this point
    if (currentNewRegion.length > 0) {
        allRegions.push({   filePath: currentFilePath,
                lineStart: currentNewRegionLineStart,
                lines: currentNewRegion
            });
        currentNewRegion = [];
    }

    allRegions = allRegions.map(regionObj => {
        return Object.assign({}, { pullRequestNumber: prNumber, repository: repositoryId }, regionObj)
    });

    return allRegions;
}

const createInsertHunks = async (insertHunks) => {
    var bulkInsertResult;
    try {
        bulkInsertResult = await InsertHunk.insertMany(insertHunks);
    }
    catch (err) {

        Sentry.setContext("scanRepositories", {
            message: `generateAllCommitDiffs -  InsertHunk error occurred executing 'insertMany'`,
            numInsertHunks: insertHunks.length,
        });

        Sentry.captureException(err);
        
        console.log(err);

        throw err;

    }
}


const createInsertHunksForRepository = async (repoDiskPath, repositoryId) => {

    // Generate diff file for all commits on Repository
    var diffFilePath;
    try {
        diffFilePath = generateAllCommitsDiffFile(repoDiskPath);
    }
    catch (err) {
        Sentry.setContext("scanRepositories", {
            message: `createInsertHunksForRepository -  generateAllCommitsDiffFile failed`,
            repoDiskPath: repoDiskPath,
        });

        Sentry.captureException(err);
        
        console.log(err);

        throw err;
    }

    // Parse Diff file
    var allInsertHunks;

    var parseDiffFileFailed = false;
    var parseDiffFileError;

    try {
        allInsertHunks = createBlamesFromPatchFile(diffFilePath, repositoryId);
    }
    catch (err) {
        Sentry.setContext("scanRepositories", {
            message: `createInsertHunksForRepository -  createBlamesFromPatchFile failed`,
            diffFilePath: diffFilePath,
            repositoryId: repositoryId,
        });

        Sentry.captureException(err);
        
        console.log(err);

        parseDiffFileError = err;

        // throw err;
    }


    // If the parsing operation failed or not, still need to attempt to delete the patch file
    try {
        deleteRepositoryDiffFile(diffFilePath);
    }
    catch (err) {
        Sentry.setContext("scanRepositories", {
            message: `createInsertHunksForRepository -  deleteRepositoryDiffFile failed`,
            diffFilePath: diffFilePath,
            repositoryId: repositoryId,
        });

        Sentry.captureException(err);
        
        console.log(err);

        throw err;
    }

    // If the parse operation failed, throw an error here
    if (parseDiffFileFailed) {
        throw parseDiffFileError;
    }


    // create InsertHunks
    try {
        await createInsertHunks(allInsertHunks);
    }
    catch (err) {
        Sentry.setContext("scanRepositories", {
            message: `createInsertHunksForRepository -  createInsertHunks failed`,
            numInsertHunks: allInsertHunks.length,
            repositoryId: repositoryId,
            repoDiskPath: repoDiskPath,
        });

        Sentry.captureException(err);
        
        console.log(err);

        throw err;
    }

}

const createPRInsertHunksForRepository = async (repositoryId, repositoryFullName, installationClient) => {
    // Fetch All PRs for Repository from DB
    var repositoryPRs;
    try {
        repositoryPRs = await fetchAllPRsFromDB(repositoryId, "_id repository number");
    }
    catch (err) {
        Sentry.setContext("scanRepositories", {
            message: `createPRInsertHunksForRepository -  fetchAllPRsFromDB failed`,
            repositoryId: repositoryId,
        });

        Sentry.captureException(err);
        
        console.log(err);

        throw err;
    }

    var allPRNumbers = repositoryPRs.map( prObj => prObj.number );

    // Execute Requests to get PR diff content for all PR numbers
    var prDiffRequestList = allPRNumbers.map( async (number) => {

        var diffContent;
        try {
            diffContent = await getPRDiffContent(installationClient, repositoryFullName, number);
        }
        catch (err) {
            Sentry.setContext("createPRInsertHunksForRepository", {
                message: `getPRDiffContent failed`,
                repositoryFullName: repositoryFullName,
                prNumber: number,
            });

            Sentry.captureException(err);
            console.log(err);
            return {error: 'Error'};
        }

        return {  diff: diffContent, prNumber: number };
    });

    // Execute all requests
    var prDiffScrapeListResults;
    try {
        prDiffScrapeListResults = await Promise.allSettled(prDiffRequestList);
    }
    catch (err) {
        Sentry.setContext("createPRInsertHunksForRepository", {
            message: `Executing bulk PR diff Scrape Requests failed`,
            repositoryId: repositoryId,
            repositoryFullName: repositoryFullName,
        });

        Sentry.captureException(err);
        throw err;
    }

    validResults = prDiffScrapeListResults.filter(resultObj => resultObj.value && !resultObj.value.error);
    validResults = validResults.map(resultObj => resultObj.value);

    // Parse all diffs to generate InsertHunks
    var i = 0;
    var allPRInsertHunks = [];
    for (i = 0; i < validResults.length; i++) {
        allPRInsertHunks.push(createBlamesFromPRPatch(validResults[i].diff, validResults[i].prNumber, repositoryId));
    }

    allPRInsertHunks = allPRInsertHunks.flat();

    console.log("allPRInsertHunks: ");
    console.log(allPRInsertHunks);

    // Create all InsertHunks
    try {
        await createInsertHunks(allPRInsertHunks);
    }
    catch (err) {
        Sentry.setContext("createPRInsertHunksForRepository", {
            message: `createInsertHunks failed`,
            repositoryId: repositoryId,
            repositoryFullName: repositoryFullName,
        });

        Sentry.captureException(err);
        throw err;
    }
}


module.exports = {
    createInsertHunksForRepository,
    createPRInsertHunksForRepository
}