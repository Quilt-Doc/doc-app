
const Sentry = require("@sentry/node");
const InsertHunk = require('../../models/InsertHunk');


const getPRDiffContent = async (installationClient, repositoryFullName, prNumber) => {

    var prDiffResponse;
    try {
        prDiffResponse = await installationClient.get(`/repos/${repositoryFullName}/pulls/${prNumber}`,
            {
                headers: {
                    "Content-Type": "application/vnd.github.v3.diff",
                    accept: "application/vnd.github.v3.diff",
                }
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

    for (i = 0; i < prPatchLines.length; i++) {

        line = prPatchLines[i];

        line = line.toString("ascii");

        // If we are on the line where the full 'diff' command is displayed
        if (line.substring(0, 4).includes("diff")) {

            // Handle end of any regions being built until this point
            if (currentNewRegion.length > 0) {
                allRegions.push({
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

            // console.log("currentFilePath: ", currentFilePath);
        }

        // New hunk header
        else if (line.substring(0, 2).includes("@@")) {

            // Handle end of any regions being built until this point
            if (currentNewRegion.length > 0) {
                allRegions.push({
                    filePath: currentFilePath,
                    lineStart: currentNewRegionLineStart,
                    lines: currentNewRegion
                });
                currentNewRegion = [];
            }


            // Get hunk header without any suffixes "@@ -1,13 +3,34 @@"
            var endIndex = line.substring(2, line.length).indexOf("@@") + 2;
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
                allRegions.push({
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
    }

    // Handle end of any regions being built until this point
    if (currentNewRegion.length > 0) {
        allRegions.push({
            filePath: currentFilePath,
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
    console.log(`createInsertHunks: Attempting to create #${insertHunks.length} InsertHunks`);

    insertHunks = insertHunks.map(hunkObj => {
        var temp = hunkObj.lines.map(line => {
            if (line.length < 1) {
                return '\n';
            }
            return line;
        });
        return Object.assign({}, hunkObj, { lines: temp });
    });

    // console.log("insertHunks: ");
    // console.log(insertHunks);


    var bulkInsertResult;
    try {
        bulkInsertResult = await InsertHunk.insertMany(insertHunks);
    }
    catch (err) {

        Sentry.setContext("createInsertHunks", {
            message: `generateAllCommitDiffs -  InsertHunk error occurred executing 'insertMany'`,
            numInsertHunks: insertHunks.length,
        });

        Sentry.captureException(err);

        console.log(err);

        throw err;

    }
}


module.exports = {
    getPRDiffContent,
    createBlamesFromPRPatch,
    createInsertHunks
}