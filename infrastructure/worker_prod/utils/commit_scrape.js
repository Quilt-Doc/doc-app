

const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

const {serializeError, deserializeError} = require('serialize-error');

var LinkHeader = require( 'http-link-header' );
const parseUrl = require("parse-url");
const queryString = require('query-string');

const { fetchAllRepoBranchesAPI, enrichBranchesAndPRs, enhanceBranchesWithPRMongoIds, insertBranchesFromAPI } = require('./github_repos/branch_utils');
const { fetchAllRepoPRsAPI, enrichPRsWithFileList, insertPRsFromAPI } = require('./github_repos/pr_utils');
const { fetchAllRepoCommitsCLI, insertAllCommitsFromCLI } = require('./github_repos/commit_utils');

const { at } = require("lodash");

const { cloneInstallationRepo } = require('./github_repos/cli_utils');


// Procedure:
// Get all of the branches on the repository, paginate if necessary
// Iterate through list of branches, fetching list of commits from each branch, paginate if necessary

// KARAN TODO: Why doesn't the Branch listing endpoint return a Link header or a meta object in the response?
// ISSUE: Each branch contains a complete history of all of the commits which causes lots of issues
const scrapeGithubRepoCommitsAPI = async (installationId, repositoryId, installationClient, repositoryObj, workspaceId, worker) => {

    // var timestamp = new Date().toISOString();

    var foundBranchList;
    try {
        foundBranchList = await fetchAllRepoBranchesAPI(installationClient, repositoryObj.fullName, worker);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    message: serializeError(err),
                                                    errorDescription: `Error fetching all repo branches - installationId, repositoryObj.fullName: ${installationId}, ${repositoryObj.fullName}`,
                                                    source: 'worker-instance',
                                                    function: 'scrapeGithubRepoCommitsAPI'}
                            });
        throw err;
    }


    pageNum = 0;
    perPage = 100;

    // GET /repos/{owner}/{repo}/commits
    var listCommitRequestList = foundBranchList.map( async (branchObj) => {

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
            }
            catch (err) {
                await worker.send({action: 'log', info: {level: 'error',
                                                            message: serializeError(err),
                                                            errorDescription: `Github API List Commits failed - installationId, repositoryObj.fullName, branchName: ${installationId}, ${repositoryObj.fullName}, ${foundBranchList[0].name}`,
                                                            source: 'worker-instance',
                                                            function: 'scrapeGithubRepoCommitsAPI'}});
                                                            console.log(err);
                return {error: 'Error', branchName: branchObj.name};
                // throw new Error(`Github API List Commits failed - installationId, repositoryObj.fullName, branchName: ${installationId}, ${repositoryObj.fullName}, ${foundBranchList[0].name}`);
            }

            if (!commitListResponse.headers.link) {
                pageNum = lastPageNum;
            }
            
            else {
                var link = LinkHeader.parse(commitListResponse.headers.link);

                await worker.send({action: 'log', info: {
                    level: 'info',
                    message: `commitListResponse.headers.link: ${JSON.stringify(link)}`,
                    source: 'worker-instance',
                    function: 'scrapeGithubRepoCommitsAPI',
                }});


                var i;
                for (i = 0; i < link.refs.length; i++) {
                    if (link.refs[i].rel == 'last') {
                        /*
                        await worker.send({action: 'log', info: {
                            level: 'info',
                            message: `found last ref - link.refs[i]: ${JSON.stringify(link.refs[i])}`,
                            source: 'worker-instance',
                            function: 'scrapeGithubRepoCommits',
                        }});
                        */

                        searchString = parseUrl(link.refs[i].uri).search;

                        /*
                        await worker.send({action: 'log', info: {
                            level: 'info',
                            message: `last ref searchString - searchString: ${searchString}`,
                            source: 'worker-instance',
                            function: 'scrapeGithubRepoCommits',
                        }});
                        
                        await worker.send({action: 'log', info: {
                            level: 'info',
                            message: `parsed searchString - queryString.parse(searchString): ${JSON.stringify(queryString.parse(searchString))}`,
                            source: 'worker-instance',
                            function: 'scrapeGithubRepoCommits',
                        }});
                        */

                        lastPageNum = queryString.parse(searchString).page;
                        break;
                    }
                }
            }

            await worker.send({action: 'log', info: {
                level: 'info',
                message: `commitListResponse - lastPageNum, searchString: ${lastPageNum}, ${searchString}`,
                source: 'worker-instance',
                function: 'scrapeGithubRepoCommitsAPI',
            }});

            if (commitListResponse.data.length < 1) {
                break;
            }

            commitPageNum += 1;


            await worker.send({action: 'log', info: {
                level: 'info',
                message: `commitListResponse.data.length: ${commitListResponse.data.length}`,
                source: 'worker-instance',
                function: 'scrapeGithubRepoCommitsAPI',
            }});

            foundCommitList.push(commitListResponse.data);
        }

        return foundCommitList.flat();
    });


    // Execute all requests
    var results;
    try {
        results = await Promise.allSettled(listCommitRequestList);
    }
    catch (err) {
        await logger.error({source: 'worker-instance',
                            message: serializeError(err),
                            errorDescription: `Error Promise.allSettled listing commits failed`,
                            function: 'scrapeGithubRepoCommitsAPI'});
        throw err;
    }



    // Non-error responses
    validResults = results.filter(resultObj => resultObj.value && !resultObj.value.error);

    // Error responses
    invalidResults = results.filter(resultObj => resultObj.value && resultObj.value.error);


    await worker.send({action: 'log', info: {
        level: 'info',
        message: `listCommitRequestList validResults.length: ${validResults.length}`,
        source: 'worker-instance',
        function: 'scrapeGithubRepoCommitsAPI',
    }});

    validResults.map( async (promiseObj) => {
        await worker.send({action: 'log', info: {
            level: 'info',
            message: `commitList length - promiseObj.value.length: ${promiseObj.value.length}`,
            source: 'worker-instance',
            function: 'scrapeGithubRepoCommitsAPI',
        }});
    });


    /*
    await worker.send({action: 'log', info: {
        level: 'info',
        message: `commitListResponse.headers: ${JSON.stringify(commitListResponse.headers)}`,
        source: 'worker-instance',
        function: 'scrapeGithubRepoCommits',
    }});

    await worker.send({action: 'log', info: {
        level: 'info',
        message: `commitListResponse.data.slice(0,2): ${JSON.stringify(commitListResponse.data.slice(0,2))}`,
        source: 'worker-instance',
        function: 'scrapeGithubRepoCommits',
    }});
    */


    // /repos/{owner}/{repo}/commits
    /*
    var listCommitRequests = foundBranchList.map(branchObj => {
        var reachedCommitListEnd = false;

    });
    */



    /*
    var listCommitResponse;
    try {
        listCommitResponse = await installationClient.get(`/repos/${repositoryObj.fullName}/commits`);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    message: serializeError(err),
                                                    errorDescription: `Github API List Commits failed - installationId, repositoryObj.fullName: ${installationId}, ${repositoryObj.fullName}`,
                                                    source: 'worker-instance',
                                                    function: 'scrapeGithubRepoCommits'}});

        throw new Error(`Github API List Commits failed - installationId, repositoryObj.fullName: ${installationId}, ${repositoryObj.fullName}`);

    }
    */
}

const scrapeGithubRepoCommitsMixed = async (installationId, repositoryId, installationClient, repositoryObj, workspaceId, worker) => {


    // Fetch all branches and PRs from Github
    var foundPRList;
    try {
        foundPRList = await fetchAllRepoPRsAPI(installationClient, installationId, repositoryObj.fullName, worker);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    message: serializeError(err),
                                                    errorDescription: `Error fetching all repo PRs - installationId, repositoryObj.fullName: ${installationId}, ${repositoryObj.fullName}`,
                                                    source: 'worker-instance',
                                                    function: 'scrapeGithubRepoCommitsMixed'}
                            });
        throw Error(`Error fetching all repo PRs - installationId, repositoryObj.fullName: ${installationId}, ${repositoryObj.fullName}`);
    }

    var foundBranchList;
    try {
        foundBranchList = await fetchAllRepoBranchesAPI(installationClient, installationId, repositoryObj.fullName, worker);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    message: serializeError(err),
                                                    errorDescription: `Error fetching all repo branches - installationId, repositoryObj.fullName: ${installationId}, ${repositoryObj.fullName}`,
                                                    source: 'worker-instance',
                                                    function: 'scrapeGithubRepoCommitsMixed'}
                            });
        throw Error(`Error fetching all repo branches - installationId, repositoryObj.fullName: ${installationId}, ${repositoryObj.fullName}`);
    }


    // Only can enrich these lists if there are both branches and PRs, still call if there are branches just for formatting
    if (foundBranchList.length > 0) {
        // Enrich Branches and PRs (attach their identifiers to each other, e.g. attach prObjIds to branches) based on each respective list
        try {
            [foundBranchList, foundPRList] = await enrichBranchesAndPRs(foundBranchList, foundPRList, installationId, repositoryId, worker);
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error',
                                                        message: serializeError(err),
                                                        errorDescription: `Error enrichingBranchesAndPRs - installationId, repositoryId, foundBranchList.length, foundPRList.length: ${installationId}, ${repositoryId}, ${foundBranchList.length}, ${foundPRList.length}`,
                                                        source: 'worker-instance',
                                                        function: 'scrapeGithubRepoCommitsMixed'}
                                });
            throw Error(`Error enrichingBranchesAndPRs - installationId, repositoryId, foundBranchList.length, foundPRList.length: ${installationId}, ${repositoryId}, ${foundBranchList.length}, ${foundPRList.length}`);
        }
    }

    // Only can find fileLists for PRs if there are PRs
    if (foundPRList.length > 0) {
        // Query from Github & set fileList field on PRs
        try {
            foundPRList = await enrichPRsWithFileList(foundPRList, installationClient, installationId, repositoryObj.fullName, worker);
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error',
                                                        message: serializeError(err),
                                                        errorDescription: `Error enrichPRsWithFileList - installationId, repositoryObj.fullName, foundPRList.length: ${installationId}, ${repositoryObj.fullName}, ${foundPRList.length}`,
                                                        source: 'worker-instance',
                                                        function: 'scrapeGithubRepoCommitsMixed'}
                                });
            throw Error(`Error enrichPRsWithFileList - installationId, repositoryObj.fullName, foundPRList.length: ${installationId}, ${repositoryObj.fullName}, ${foundPRList.length}`);
        }
    }


    // Only can insert Branches if branches objects were found

    var branchToPRMappingList = [];
    if (foundBranchList.length > 0) {

        try {
            branchToPRMappingList = await insertBranchesFromAPI(foundBranchList, installationId, repositoryId, worker);
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error',
                                                        message: serializeError(err),
                                                        errorDescription: `Error inserting Branches from API - foundBranchList.length, installationId, repositoryId: ${foundBranchList.length}, ${installationId}, ${repositoryId}`,
                                                        source: 'worker-instance',
                                                        function: 'scrapeGithubRepoCommitsMixed'}
            });

            throw Error(`Error inserting Branches from API - foundBranchList.length, installationId, repositoryId: ${foundBranchList.length}, ${installationId}, ${repositoryId}`);
        }
    }

    // Only can insert PRs is PR objects were found
    var prToBranchMapping = [];
    if (foundPRList.length > 0) {
        // Insert PRs with Branch ObjectsIds

        try {
            prToBranchMapping = await insertPRsFromAPI(foundPRList, branchToPRMappingList, installationId, repositoryId, worker);
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error',
                                                        message: serializeError(err),
                                                        errorDescription: `Error inserting PRs from API - foundPRList.length, installationId, repositoryId: ${foundPRList.length}, ${installationId}, ${repositoryId}`,
                                                        source: 'worker-instance',
                                                        function: 'scrapeGithubRepoCommitsMixed'}
            });

            throw Error(`Error inserting PRs from API - foundPRList.length, installationId, repositoryId: ${foundPRList.length}, ${installationId}, ${repositoryId}`);
        }
    }

    // Don't do this if there are no PR Objects
    if (prToBranchMapping.length > 0) {
        // Add PullRequest ObjectIds to Branch Objects
        try {
            await enhanceBranchesWithPRMongoIds(prToBranchMapping, installationId, repositoryId, worker);
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error',
                                                        message: serializeError(err),
                                                        errorDescription: `Error updating Branch Objects to have PullRequest ids- prToBranchMapping.length, installationId, repositoryId: ${prToBranchMapping.length}, ${installationId}, ${repositoryId}`,
                                                        source: 'worker-instance',
                                                        function: 'scrapeGithubRepoCommitsMixed'}
            });

            throw Error(`Error updating Branch Objects to have PullRequest ids- prToBranchMapping.length, installationId, repositoryId: ${prToBranchMapping.length}, ${installationId}, ${repositoryId}`);
        }
    }



    // Clone Repository
    var repoDiskPath;

    try {
        repoDiskPath = await cloneInstallationRepo(installationId, repositoryObj.cloneUrl, false, '', worker);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    message: serializeError(err),
                                                    errorDescription: `Error fetching all repo branches - installationId, repositoryObj.fullName: ${installationId}, ${repositoryObj.fullName}`,
                                                    source: 'worker-instance',
                                                    function: 'scrapeGithubRepoCommitsMixed'}
        });

        throw Error(`Error fetching all repo branches - installationId, repositoryObj.fullName: ${installationId}, ${repositoryObj.fullName}`);
    }


    var foundCommitList;
    try {
        foundCommitList = await fetchAllRepoCommitsCLI(installationId, repositoryObj._id.toString(), repoDiskPath, worker);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    message: serializeError(err),
                                                    errorDescription: `Error fetching all repo commits - installationId, repositoryId, repoDiskPath: ${installationId}, ${repositoryObj._id.toString()}, ${repoDiskPath}`,
                                                    source: 'worker-instance',
                                                    function: 'scrapeGithubRepoCommitsMixed'}
                            });
        throw Error(`Error fetching all repo commits - installationId, repositoryId, repoDiskPath: ${installationId}, ${repositoryObj._id.toString()}, ${repoDiskPath}`);
    }



    // Associate Commits with PullRequests and Branches
    


    var insertedCommitsCLI;
    try {
        insertedCommitsCLI = await insertAllCommitsFromCLI(foundCommitList, installationId, repositoryId, worker);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    message: serializeError(err),
                                                    errorDescription: `Error inserting Commits from CLI - foundCommitList.length, installationId, repositoryId: ${foundBrafoundCommitListnchList.length}, ${installationId}, ${repositoryId}`,
                                                    source: 'worker-instance',
                                                    function: 'scrapeGithubRepoCommitsMixed'}
        });

        throw Error(`Error inserting Branches from API - foundCommitList.length, installationId, repositoryId: ${foundCommitList.length}, ${installationId}, ${repositoryId}`);
    }


    // git rev-list --all --min-parents=2 --date=iso --format=%H%n%cd%n%T%n%an%n%cn%n%ce%n%s$n%P$%n%D%n
    
    

}

module.exports = {
    scrapeGithubRepoCommitsAPI,
    scrapeGithubRepoCommitsMixed
}