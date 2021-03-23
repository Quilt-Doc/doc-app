

const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

const {serializeError, deserializeError} = require('serialize-error');

var LinkHeader = require( 'http-link-header' );
const parseUrl = require("parse-url");
const queryString = require('query-string');

const { fetchAllRepoBranchesAPI, enrichBranchesAndPRs, enhanceBranchesWithPRMongoIds, insertBranchesFromAPI } = require('./github/branch_utils');
const { fetchAllRepoPRsAPI, enrichPRsWithFileList, insertPRsFromAPI } = require('./github/pr_utils');
const { fetchAllRepoCommitsCLI, insertAllCommitsFromCLI } = require('./github/commit_utils');

const { at } = require("lodash");

const { cloneInstallationRepo } = require('./github/cli_utils');



const scrapeGithubRepoCodeObjects = async (installationId, repositoryId, installationClient, repositoryObj, workspaceId, repoDiskPath, worker) => {


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


    var foundCommitList;
    try {
        foundCommitList = await fetchAllRepoCommitsCLI(installationId, repositoryObj._id.toString(), repoDiskPath);
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
        insertedCommitsCLI = await insertAllCommitsFromCLI(foundCommitList, installationId, repositoryId);
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
    scrapeGithubRepoCodeObjects,
}