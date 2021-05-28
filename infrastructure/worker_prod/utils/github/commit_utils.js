
const { serializeError, deserializeError } = require("serialize-error");

const Commit = require("../../models/Commit");
const Repository = require("../../models/Repository");

const { spawnSync } = require("child_process");

const { printExecTime } = require("../print");

const lineByLine = require("n-readlines");

const Sentry = require("@sentry/node");

// DEPRECATED
// Procedure:
// Get all of the branches on the repository, paginate if necessary
// Iterate through list of branches, fetching list of commits from each branch, paginate if necessary

// KARAN TODO: Why doesn't the Branch listing endpoint return a Link header or a meta object in the response?
// ISSUE: Each branch contains a complete history of all of the commits which causes lots of issues
const scrapeGithubRepoCommitsAPI = async (installationId, repositoryId, installationClient, repositoryObj, workspaceId) => {

    // var timestamp = new Date().toISOString();

    var foundBranchList;
    try {
        foundBranchList = await fetchAllRepoBranchesAPI(installationClient, repositoryObj.fullName);
    } catch (err) {

        console.log(err);

        Sentry.setContext("scrapeGithubRepoCommitsAPI", {
            message: "Error fetching all repo branches",
            installationId: installationId,
            repositoryFullName: repositoryObj.fullName,
        });

        Sentry.captureException(err);

        throw err;
    }


    pageNum = 0;
    perPage = 100;

    // GET /repos/{owner}/{repo}/commits
    var listCommitRequestList = foundBranchList.map(async (branchObj) => {

        var commitPageNum = 0;
        var commitsPerPage = 100;
        // Default value of 10
        var lastPageNum = 10;
        var commitListResponse;

        var foundCommitList = [];
        var searchString;

        while (commitPageNum <= lastPageNum) {
            try {
                commitListResponse = await installationClient.get(`/repos/${repositoryObj.fullName}/commits?sha=${branchObj.name}&page=${commitPageNum}&per_page=${commitsPerPage}`);
            } catch (err) {

                console.log(err);
                return { error: "Error", branchName: branchObj.name };
                // throw new Error(`Github API List Commits failed - installationId, repositoryObj.fullName, branchName: ${installationId}, ${repositoryObj.fullName}, ${foundBranchList[0].name}`);
            }

            if (!commitListResponse.headers.link) {
                pageNum = lastPageNum;
            } else {
                var link = LinkHeader.parse(commitListResponse.headers.link);

                console.log(`commitListResponse.headers.link: ${JSON.stringify(link)}`);


                var i;
                for (i = 0; i < link.refs.length; i++) {
                    if (link.refs[i].rel == "last") {
                        searchString = parseUrl(link.refs[i].uri).search;

                        lastPageNum = queryString.parse(searchString).page;
                        break;
                    }
                }
            }

            console.log(`commitListResponse - lastPageNum, searchString: ${lastPageNum}, ${searchString}`);

            if (commitListResponse.data.length < 1) {
                break;
            }

            commitPageNum += 1;

            console.log(`commitListResponse.data.length: ${commitListResponse.data.length}`);

            foundCommitList.push(commitListResponse.data);
        }

        return foundCommitList.flat();
    });


    // Execute all requests
    var results;
    try {
        results = await Promise.allSettled(listCommitRequestList);
    } catch (err) {
        console.log("Error Promise.allSettled listing commits failed");
        throw err;
    }

    // Non-error responses
    validResults = results.filter(resultObj => resultObj.value && !resultObj.value.error);

    // Error responses
    invalidResults = results.filter(resultObj => resultObj.value && resultObj.value.error);

    console.log(`listCommitRequestList validResults.length: ${validResults.length}`);

    validResults.map(async (promiseObj) => {
        console.log(`commitList length - promiseObj.value.length: ${promiseObj.value.length}`);
    });
};


const parseRepoCommitsNoDiff = (lines) => {
    var commitObjects = [];

    var i = 0;



    var currentCommitObj = {};
    var atNewCommit = false;
    var currentFileList = [];

    for (i = 0; i < lines.length; i++) {
        currentLine = lines[i];

        if (currentLine == "END") {
            atNewCommit = true;
            if (i == 0) {
                continue;
            }

            currentCommitObj.fileList = currentFileList;
            commitObjects.push(currentCommitObj);

            currentFileList = [];
            currentCommitObj = {};
        }
        // Skip whitespace lines
        else if (currentLine.trim().length < 1) {
            continue;
        } else if (atNewCommit == true) {
            // currentCommitObj.sha = currentLine;

            var k = 0;
            while (k < 7) {
                currentLine = lines[i];
                switch (k) {
                case 0:
                    currentCommitObj.sha = currentLine;
                case 1:
                    currentCommitObj.committerDate = currentLine;
                case 2:
                    currentCommitObj.treeHash = currentLine;
                case 3:
                    currentCommitObj.authorName = currentLine;
                case 4:
                    currentCommitObj.committerName = currentLine;
                case 5:
                    currentCommitObj.committerEmail = currentLine;
                case 6:
                    currentCommitObj.commitMessage = currentLine;
                    atNewCommit = false;
                    break;
                default:
                    break;
                }

                k++;
                i++;
            }

            atNewCommit = false;
        } else if (atNewCommit == false) {
            currentFileList.push(currentLine);
        }

    }

    if (currentCommitObj) {
        currentCommitObj.fileList = currentFileList;
        commitObjects.push(currentCommitObj);
    }

    // console.log(`parseRepoCommitsNoDiffSimple last two Commit objects:`);
    // console.log(commitObjects[commitObjects.length - 1]);
    // console.log(commitObjects[commitObjects.length - 2]);

    return commitObjects;
};

const generateAllCommitObjectsFile = (repoDiskPath, scriptPath) => {

    var timestamp = Date.now().toString();

    try {
        spawnSync(scriptPath, [`../${timestamp}-repo.patch`], { cwd: repoDiskPath });
    } catch (err) {
        console.log(err);

        throw err;
    }
    return `./git_repos/${timestamp}-repo.patch`;
};

const parseRepoCommitsWithBody = (commitFilePath) => {

    const liner = new lineByLine(commitFilePath);

    var commitObjects = [];

    var i = 0;

    var currentCommitObj = {};
    var atNewCommit = false;
    var currentFileList = [];

    var line;

    // eslint-disable-next-line no-cond-assign
    while (line = liner.next()) {

        line = line.toString("ascii");

        if (line == "END") {
            atNewCommit = true;
            if (i == 0) {
                continue;
            }

            currentCommitObj.fileList = currentFileList;
            commitObjects.push(currentCommitObj);

            currentFileList = [];
            currentCommitObj = {};
        } else if (line.trim().length < 1) {
            // Skip whitespace lines
            continue;
        } else if (atNewCommit == true) {
            // currentCommitObj.sha = line;

            var k = 0;
            var reachedCommitMessageEnd = false;
            while (reachedCommitMessageEnd == false) {

                switch (k) {
                case 0:
                    currentCommitObj.sha = line;
                    break;
                case 1:
                    currentCommitObj.committerDate = line;
                    break;
                case 2:
                    currentCommitObj.treeHash = line;
                    break;
                case 3:
                    currentCommitObj.authorName = line;
                    break;
                case 4:
                    currentCommitObj.committerName = line;
                    break;
                case 5:
                    currentCommitObj.committerEmail = line;
                    break;
                default:
                    break;
                }

                if (k > 5) {

                    if (line.trim() == "COMMIT_MSG_END") {
                        atNewCommit = false;
                        reachedCommitMessageEnd = true;
                    } else {
                        if (k == 6) {
                            currentCommitObj.commitMessage = line;
                        } else {
                            currentCommitObj.commitMessage = `${currentCommitObj.commitMessage}\n${line}`;
                        }
                    }
                }

                line = liner.next();
                line = line.toString("ascii");

                k++;
                i++;
            }
            atNewCommit = false;
        } else if (atNewCommit == false) {
            currentFileList.push(line);
        }

        i++;
    }

    if (currentCommitObj) {
        currentCommitObj.fileList = currentFileList;
        commitObjects.push(currentCommitObj);
    }

    return commitObjects;
};

const deleteCommitObjectsFile = (commitsFilePath) => {

    try {
        spawnSync("rm", [`${commitsFilePath}`]);
    } catch (err) {
        console.log(err);

        throw err;
    }

};


const fetchAllRepoCommitsCLI = async (installationId, repositoryId, repoDiskPath) => {

    console.log(`fetchAllRepoCommitsCLI - repoDiskPath: ${repoDiskPath}`);

    var start = process.hrtime();

    // Generate Commit Object File
    var commitObjFilePath;
    try {
        // var repoDiskPath = 'git_repos/' + timestamp +'/';
        // ../ = git_repos/*
        // ../../ = worker_prod/*
        commitObjFilePath = generateAllCommitObjectsFile(repoDiskPath, "../../git_scripts/print_all_commits_v2.sh");
    } catch (err) {
        console.log(err);

        Sentry.setContext("fetchAllRepoCommitsCLI", {
            message: "Failed to run print_all_commits_v2, cannot get Commit data from CLI",
            repositoryId: repositoryId,
            reposDiskPath: repoDiskPath,
        });

        Sentry.captureException(err);

        throw err;
    }

    printExecTime(process.hrtime(start), `generateAllCommitObjectsFile("${repoDiskPath}", "../../git_scripts/print_all_commits_v2.sh")`);
    console.log(`commitObjFilePath: ${commitObjFilePath}`);
    // throw Error("STOP");

    start = process.hrtime();
    // Parse Commit Object File
    var commitObjects;
    try {
        commitObjects = parseRepoCommitsWithBody(commitObjFilePath);
    } catch (err) {
        console.log(err);

        Sentry.setContext("fetchAllRepoCommitsCLI", {
            message: `parseRepoCommitsWithBody(${commitObjFilePath}) failed`,
            repositoryId: repositoryId,
            reposDiskPath: repoDiskPath,
        });

        Sentry.captureException(err);

        throw err;
    }

    printExecTime(process.hrtime(start), `parseRepoCommitsWithBody("${commitObjFilePath}")`);


    
    // Delete Commit Object File
    try {
        deleteCommitObjectsFile(commitObjFilePath);
    } catch (err) {
        console.log(err);

        Sentry.setContext("fetchAllRepoCommitsCLI", {
            message: `deleteCommitObjectsFile("${commitObjFilePath}") failed`,
            repositoryId: repositoryId,
            reposDiskPath: repoDiskPath,
        });

        Sentry.captureException(err);

        throw err;
    }
    

    return commitObjects;
};

const insertAllCommitsFromCLI = async (foundCommitsList, installationId, repositoryId) => {


    foundCommitsList = foundCommitsList.map(commitObj => {
        return Object.assign({}, commitObj, {   name: commitObj.commitMessage,
            creator: commitObj.committerName,
            repository: repositoryId,
            sourceId: commitObj.sha,
            sourceCreationDate: commitObj.committerDate });
    });

    var bulkInsertResult;
    try {
        bulkInsertResult = await Commit.insertMany(foundCommitsList);
    } catch (err) {

        console.log(err);

        Sentry.setContext("insertAllCommitsFromCLI", {
            message: "Error bulk inserting Commits",
            repositoryId: repositoryId,
            installationId: installationId,
            numCommits: foundCommitsList.length,
        });

        Sentry.captureException(err);

        throw err;
    }

    return foundCommitsList;
};

const fetchAllInsertedRepositoryCommits = async (repositoryId, selectionString) => {
    var insertedCommits;
    try {
        insertedCommits = await Commit.find({ repository: repositoryId }, selectionString)
            .lean()
            .exec();
    } catch (err) {
        console.log(err);

        Sentry.setContext("fetchAllInsertedRepositoryCommits", {
            message: "Error finding Repository Commits",
            repositoryId: repositoryId,
            selectionString: selectionString,
        });

        Sentry.captureException(err);

        throw err;
    }
    return insertedCommits;
};




const updateRepositoryLastProcessedCommits = async (unscannedRepositories, unscannedRepositoryIdList, installationIdLookup, installationClientList) => {
    // Get Repository commits for all unscanned Repositories
    // Handle 409 Responses
    var repositoryListCommits;
    try {
        urlList = unscannedRepositories.map(repositoryObj => {
            return { url: `/repos/${repositoryObj.fullName}/commits/${repositoryObj.defaultBranch}`, repositoryId: repositoryObj._id.toString() };
        });

        var requestPromiseList = urlList.map(async (urlObj) => {
            var response;
            var currentInstallationId = installationIdLookup[urlObj.repositoryId];
            try {
                // KARAN TODO: Replace installationClient with a method to fetch the correct installationClient by repositoryId
                response = await installationClientList[currentInstallationId].get(urlObj.url);
            } catch (err) {

                Sentry.setContext("scan-repositories", {
                    message: "scanRepositories failed fetching repository commits from Github API - GET \"/repos/:owner/:name/commits/:default_branch\"",
                    requestUrl: urlObj.url,
                });

                Sentry.captureException(err);

                return { error: "Error", statusCode: err.response.status };
            }
            return response;
        });

        repositoryListCommits = await Promise.allSettled(requestPromiseList);

        // Get all successful results and 409 responses
        // add 'isEmptyRepository' & 'failed' fields to hold status of request
        repositoryListCommits = repositoryListCommits.map(resultObj => {
            var temp = resultObj;
            if (temp.value) {
                // Was it an empty Repository
                if (temp.value.error && temp.value.statusCode == 409) {
                    temp.isEmptyRepository = true;
                    temp.failed = false;
                }
                // If there's some other error we need to not continue with operations on that Repository
                else if (temp.value.error) {
                    temp.isEmptyRepository = false;
                    temp.failed = true;
                }
                // If there's no error field and a value field, treat as success
                else {
                    temp.isEmptyRepository = false;
                    temp.failed = false;
                }
            }
            // If value somehow is falsey, treat as failure
            else {
                temp.isEmptyRepository = false;
                temp.failed = true;
            }
            return temp;
        });
    } catch (err) {
        Sentry.setContext("scan-repositories", {
            message: "scanRepositories failed fetching repository commits from Github API - GET \"/repos/:owner/:name/commits/:default_branch\"",
            urlList: urlList,
        });

        Sentry.captureException(err);

        throw err;
    }

    // Bulk update repository 'lastProcessedCommit' fields
    // If repository is empty, set 'lastProcessedCommit' to 'EMPTY'
    // If repository 'failed' is true, return a value that will be filtered out on the bulkWrite
    const bulkLastCommitOps = repositoryListCommits.map((repositoryCommitResponse, idx) => {
        // TODO: Figure out why this list commits endpoint isn't returning an array

        var commitFieldValue;

        if (repositoryCommitResponse.isEmptyRepository == true && !repositoryCommitResponse.failed) {
            commitFieldValue = "EMPTY";
        } else if (!repositoryCommitResponse.failed) {
            commitFieldValue = repositoryCommitResponse.value.data.sha;
        }

        // If failed
        else if (repositoryCommitResponse.failed) {
            return undefined;
        }

        return {
            updateOne: {
                filter: { _id: unscannedRepositories[idx]._id },
                // Where field is the field you want to update
                update: { $set: { lastProcessedCommit: commitFieldValue } },
                upsert: false,
            },
        };
    });

    console.log("BULK LAST COMMIT OPS: ");
    console.log(JSON.stringify(bulkLastCommitOps));

    if (bulkLastCommitOps.length > 0 && bulkLastCommitOps.filter(op => op).length > 0) {
        try {
            // Filter out undefined operations (these are operations on repositories whose '/commits/' API calls have failed)
            const bulkResult = await Repository.collection.bulkWrite(bulkLastCommitOps.filter(op => op));
            console.log(`bulk Repository 'lastProcessCommit' update results: ${JSON.stringify(bulkResult)}`);
        } catch (err) {

            Sentry.setContext("scan-repositories", {
                message: "scanRepositories failed bulk updating lastProcessedCommit on repositories",
                unscannedRepositoryIdList: unscannedRepositoryIdList,
            });

            Sentry.captureException(err);

            throw err;
        }
    }

    return repositoryListCommits;

};


module.exports = {
    fetchAllRepoCommitsCLI,
    insertAllCommitsFromCLI,
    fetchAllInsertedRepositoryCommits,
    updateRepositoryLastProcessedCommits,
};