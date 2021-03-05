const fs = require('fs');

const apis = require('../apis/api');


require('dotenv').config();

const constants = require('../constants/index');

const Workspace = require('../models/Workspace');
const Repository = require('../models/Repository');
const Reference = require('../models/Reference');


const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

// const { filterVendorFiles } = require('../utils/validate_utils');

const { scrapeGithubRepoCommitsAPI, scrapeGithubRepoCommitsMixed } = require('../utils/commit_scrape');
const { updateRepositoryLastProcessedCommits } = require('../utils/github/commit_utils');
const { generateRepositoryReferences } = require('../utils/references/index');


const { scrapeGithubRepoProjects } = require('../utils/integrations/github_project_utils');
const { scrapeGithubRepoIssues } = require('../utils/integrations/github_issue_utils');

const { cloneInstallationRepo } = require('../utils/github/cli_utils');

const { spawnSync } = require('child_process');



const { generateGithubIssueBoard, generateGithubIssueBoardAPI, generateAssociationsFromResults } = require("../utils/associations/utils");


const {serializeError, deserializeError} = require('serialize-error');

const Sentry = require("@sentry/node");

let db = mongoose.connection;


const deleteClonedRepositories = async (clonedRepositoryDiskPaths) => {
    var repositoryDeleteProcesses = clonedRepositoryDiskPaths.map( async (repoDiskPath) => {

        var timestamp = repoDiskPath.replace('git_repos/', '').replace('/', '');

        spawnSync('rm', ['-rf', `${timestamp}`], {cwd: './' + 'git_repos/'});
    });

    await Promise.allSettled(repositoryDeleteProcesses);

}



const scanRepositories = async () => {

    var worker = require('cluster').worker;

    const session = await db.startSession();

    var workspaceId = process.env.workspaceId;

    var deletedLocalRepos = false;

    var clonedRepositoryDiskPaths = [];

    var transactionAborted = false;
    var transactionError = {message: ''};
    try {
        await session.withTransaction(async () => {

            // KARAN TODO: Replace this with updated var name
            var installationIdLookup = JSON.parse(process.env.installationIdLookup);
            var repositoryInstallationIds = JSON.parse(process.env.repositoryInstallationIds);

            var repositoryIdList = JSON.parse(process.env.repositoryIdList);

            var urlList;


            var repositoryObjList;

            try {
                repositoryObjList = await Repository.find({_id: { $in: repositoryIdList}, installationId: { $in: repositoryInstallationIds }}, null, { session });
            }
            catch (err) {

                Sentry.setContext("scan-repositories", {
                    message: `scanRepositories could not get Repository Objects from MongoDB`,
                    repositoryInstallationIds: repositoryInstallationIds,
                    repositoryIdList: repositoryIdList,
                });

                Sentry.captureException(err);

                throw err;
            }


            // Filter out repositories with 'scanned' == true
            var unscannedRepositories = repositoryObjList.filter(repositoryObj => repositoryObj.scanned == false);
            var unscannedRepositoryIdList = unscannedRepositories.map(repositoryObj => repositoryObj._id);

            // Filter out repositories with 'scanned' == false
            var scannedRepositories = repositoryObjList.filter(repositoryObj => repositoryObj.scanned == true);
            var scannedRepositoryIdList = scannedRepositories.map(repositoryObj => repositoryObj._id);

            // If all repositories within this workspace have already been scanned, nothing to do
            if (unscannedRepositories.length == 0) {
                // Set workspace 'setupComplete' to true
                try {
                    await Workspace.findByIdAndUpdate(workspaceId, {$set: {setupComplete: true}}, { session }).exec();
                }
                catch (err) {

                    Sentry.setContext("scan-repositories", {
                        message: `scanRepositories could not set Workspace.setupComplete = true`,
                        workspaceId: workspaceId,
                    });

                    Sentry.captureException(err);
                    throw err;
                }
                console.log(`No repositories to scan for repositoryIdList: ${JSON.stringify(repositoryIdList)}`);
                return true;
                // throw new Error(`No repositories to scan for repositoryIdList: ${JSON.stringify(repositoryIdList)}`);
            }


            // Set unsannedRepositories currentlyScanning = true
            var workspaceRepositories;
            try {
                workspaceRepositories = await Repository.updateMany({_id: { $in: unscannedRepositoryIdList.map(id => ObjectId(id.toString()))}, scanned: false}, {$set: { currentlyScanning: true }}, { session });
            }
            catch (err) {

                Sentry.setContext("scan-repositories", {
                    message: `scanRepositories failed updating unscannedRepositories 'currentlyScanning: true'`,
                    unscannedRepositoryIdList: unscannedRepositoryIdList,
                });

                Sentry.captureException(err);

                throw err;
            }

            var installationClientList;

            try {
                installationClientList = await Promise.all(repositoryInstallationIds.map(async (id) => {
                    return { [id]: await apis.requestInstallationClient(id)};
                }));

                installationClientList = Object.assign({}, ...installationClientList);
            }
            catch (err) {
                Sentry.setContext("scan-repositories", {
                    message: `scanRepositories failed fetching installationClientList`,
                    repositoryInstallationIds: repositoryInstallationIds,
                });

                Sentry.captureException(err);

                throw err;
            }






            // Get Repository objects from github for all unscanned Repositories
            var repositoryListObjects;
            try {
                urlList = unscannedRepositories.map(repositoryObj => {
                    return {url: `/repos/${repositoryObj.fullName}`, repositoryId: repositoryObj._id.toString()};
                });
                // fetch the correct installationClient by getting relevant installationId from the repositoryId
                var requestPromiseList = urlList.map( async (urlObj) => {
                    var currentInstallationId = installationIdLookup[urlObj.repositoryId];
                    return await installationClientList[currentInstallationId].get(urlObj.url);
                });

                repositoryListObjects = await Promise.all(requestPromiseList);
            }
            catch (err) {
                console.log("Github API - Can't get Repository Objects");
                Sentry.setContext("scan-repositories", {
                    message: `scanRepositories failed fetching Repository objects from Github API - GET "/repos/:owner/:name/"`,
                    urlList: urlList,
                });

                Sentry.captureException(err);

                throw err;
            }

            // Bulk update 'cloneUrl', 'htmlUrl', and 'defaultBranch' fields
            // Update our local list of unscannedRepositories to include the default_branch at the same time
            const bulkFieldUpdateOps = repositoryListObjects.map((repositoryListObjectResponse, idx) => {
                unscannedRepositories[idx].defaultBranch = repositoryListObjectResponse.data.default_branch
                unscannedRepositories[idx].cloneUrl = repositoryListObjectResponse.data.clone_url;
                unscannedRepositories[idx].htmlUrl = repositoryListObjectResponse.data.html_url;

                return {
                    updateOne: {
                            filter: { _id: unscannedRepositories[idx]._id },
                            // Where field is the field you want to update
                            update: { $set: { htmlUrl: repositoryListObjectResponse.data.html_url,
                                                cloneUrl: repositoryListObjectResponse.data.clone_url,
                                                defaultBranch:  repositoryListObjectResponse.data.default_branch} },
                            upsert: false
                    }
                }
            });

            if (bulkFieldUpdateOps.length > 0) {
                try {
                    const bulkResult = await Repository.collection.bulkWrite(bulkFieldUpdateOps, { session });
                    console.log(`bulk Repository 'html_url', 'clone_url', 'default_branch' update results: ${JSON.stringify(bulkResult)}`);
                }
                catch(err) {

                    Sentry.setContext("scan-repositories", {
                        message: `scanRepositories failed bulk updating Repository.{html_url, clone_url, default_branch}`,
                        unscannedRepositoryIdList: unscannedRepositoryIdList,
                    });
    
                    Sentry.captureException(err);

                    throw err;
                }
            }




            // Import Github Projects for all Repositories in Workspace

            // unscannedRepositories

            // installationId, repositoryId, installationClient, repositoryObj, worker

            if (!process.env.NO_GITHUB_PROJECTS) {
                var repositoryProjectsRequestList = unscannedRepositories.map(async (repositoryObj, idx) => {
                    try {
                        await scrapeGithubRepoProjects(repositoryObj.installationId,
                            repositoryObj._id.toString(),
                            installationClientList[unscannedRepositories[idx].installationId],
                            repositoryObj,
                            workspaceId,
                            worker);
                    }
                    catch (err) {
                        console.log(err);
                        return {error: 'Error'};
                    }
                    return { success: true }
                });
            
                // Execute all requests
                var projectScrapeListResults;
                try {
                    projectScrapeListResults = await Promise.allSettled(repositoryProjectsRequestList);
                }
                catch (err) {
                
                    Sentry.setContext("scan-repositories", {
                        message: `scanRepositories failed scraping Repository Projects`,
                        unscannedRepositoryIdList: unscannedRepositoryIdList,
                    });

                    Sentry.captureException(err);

                    throw err;
                }
            }






            var repositoryCommitsRequestList = unscannedRepositories.map(async (repositoryObj, idx) => {
                try {
                    // Clone Repository
                    var repoDiskPath;

                    repoDiskPath = await cloneInstallationRepo(repositoryObj.installationId, repositoryObj.cloneUrl, false, '', worker);

                    clonedRepositoryDiskPaths.push(repoDiskPath);

                    await scrapeGithubRepoCommitsMixed(repositoryObj.installationId,
                        repositoryObj._id.toString(),
                        installationClientList[unscannedRepositories[idx].installationId],
                        repositoryObj,
                        workspaceId,
                        repoDiskPath,
                        worker);
                }
                catch (err) {
                    console.log(err);

                    Sentry.setContext("scan-repositories", {
                        message: `scanRepositories failed scraping Repository Code Objects`,
                        installationId: repositoryObj.installationId,
                        cloneUrl: repositoryObj.cloneUrl,
                    });

                    Sentry.captureException(err);

                    return {error: 'Error'};
                }
                return { success: true }
            });

            // Execute all requests
            var commitScrapeListResults;
            try {
                commitScrapeListResults = await Promise.allSettled(repositoryCommitsRequestList);
            }
            catch (err) {
                
                Sentry.setContext("scan-repositories", {
                    message: `scanRepositories failed scraping Repository Commits`,
                    unscannedRepositoryIdList: unscannedRepositoryIdList,
                });

                Sentry.captureException(err);
                
                throw err;
            }





            // Scrape Github Issues depending on ENV variable
            if (!process.env.NO_GITHUB_ISSUES) {
                var repositoryIssuesRequestList = unscannedRepositories.map(async (repositoryObj, idx) => {
                    var integrationBoardId;
                    try {
                        console.log(`Scraping Github Issues from Repository: ${repositoryObj.htmlUrl}`);
                        integrationBoardId = await generateGithubIssueBoardAPI(workspaceId, repositoryObj._id.toString());

                        await scrapeGithubRepoIssues(repositoryObj.installationId,
                            repositoryObj._id.toString(),
                            installationClientList[unscannedRepositories[idx].installationId],
                            repositoryObj,
                            workspaceId,
                            integrationBoardId,
                            worker);
                    
                    }
                    catch (err) {
                        Sentry.captureException(err);
                        console.log(err);
                        return {error: 'Error'};
                    }
                    return { success: true, integrationBoardId: integrationBoardId, repositoryId: repositoryObj._id.toString() };
                });
            
                // Execute all requests
                var issueScrapeListResults;
                try {
                    issueScrapeListResults = await Promise.allSettled(repositoryIssuesRequestList);
                }
                catch (err) {
                    Sentry.setContext("scan-repositories", {
                        message: `scanRepositories failed scraping Repository Issues`,
                        unscannedRepositoryIdList: unscannedRepositoryIdList,
                    });

                    Sentry.captureException(err);
                    throw err;
                }

                // Call Association Pipline for Github Issues

                // Non-error responses
                validResults = issueScrapeListResults.filter(resultObj => resultObj.value && !resultObj.value.error);
                validResults = validResults.map(resultObj => resultObj.value);

                try {
                    await generateAssociationsFromResults(workspaceId, validResults);
                }
                catch (err) {
                    Sentry.captureException(err);
                    throw err;
                }
            }




            // Update the lastProcessedCommits for all Repositories
            var repositoryListCommits;
            try {
                repositoryListCommits = await updateRepositoryLastProcessedCommits(unscannedRepositories, unscannedRepositoryIdList, installationIdLookup, installationClientList, session);
            }
            catch (err) {
                
                console.log(err);

                Sentry.setContext("scan-repositories", {
                    message: `scanRepositories failed to update Repository lastProcessedCommits`,
                    unscannedRepositoryIdList: unscannedRepositoryIdList,
                });

                Sentry.captureException(err);
                throw err;
            }



            /*
            // Fetch, filter and insert References for Repository
            try {
                await generateRepositoryReferences(repositoryListCommits, unscannedRepositories, unscannedRepositoryIdList,
                                                    installationIdLookup, installationClientList, session);
            }
            catch (err) {
                console.log(err);

                Sentry.setContext("scan-repositories", {
                    message: `scanRepositories failed to generate unscanned Repository References`,
                    unscannedRepositoryIdList: unscannedRepositoryIdList,
                });

                Sentry.captureException(err);
                throw err;
            }
            */





            // Update 'scanned' to true, 'currentlyScanning' to false
            // For empty Repositories set 'scanned' to true, 'currentlyScanning' to false
            // For failed Repositories set 'scanned' to false, 'currentlyScanning' to false
            const bulkStatusUpdateOps = unscannedRepositories.map(repositoryObj => {

                var scannedValue;

                // If it's an empty repository
                if (repositoryObj.isEmpty) {
                    scannedValue = true;
                }
                /*
                // If it's a failed repository and not empty repository
                else if (!repositoryObj.treeSha) {
                    scannedValue = false;
                }
                */
                // If it's a successful repository
                else {
                    scannedValue = true;
                }
                
                return {
                    updateOne: {
                            filter: { _id: repositoryObj._id },
                            // Where field is the field you want to update
                            update: { $set: { scanned: scannedValue, currentlyScanning: false } },
                            upsert: false
                    }
                }
            });

            if (bulkStatusUpdateOps.length > 0) {
                try {
                    const bulkResult = await Repository.collection.bulkWrite(bulkStatusUpdateOps, { session });
                    console.log(`bulk Repository status update results: ${JSON.stringify(bulkResult)}`);
                }
                catch(err) {

                    Sentry.setContext("scan-repositories", {
                        message: `scanRepositories failed bulk updating Repository.{scanned, currentlyScanning}`,
                        unscannedRepositoryIdList: unscannedRepositoryIdList,
                    });
    
                    Sentry.captureException(err);

                    throw err;
                }
            }

            
            // Set workspace 'setupComplete' to true
            // Remove failed Repositories from the workspace 'repositories' array
            var repositoriestoRemove = unscannedRepositories.filter(repositoryObj => !repositoryObj.treeSha && !repositoryObj.isEmpty)
                                                                .map(repositoryObj => repositoryObj._id.toString());
            try {
                await Workspace.findByIdAndUpdate(workspaceId,
                                                            {
                                                                $set: {setupComplete: true},
                                                                // $pull: {repositories: { $in: repositoriestoRemove.map(id => ObjectId(id))}}
                                                            },
                                                            /*{ session }*/)
                                                            .exec();
            }
            catch (err) {

                Sentry.setContext("scan-repositories", {
                    message: `scanRepositories failed updating Workspace.setupComplete = true`,
                    repositoriestoRemove: repositoriestoRemove,
                });

                Sentry.captureException(err);

                throw err;
            }
            

            console.log(`Completed scanning repositories: ${unscannedRepositoryIdList}`);
            

            // throw new Error(`FAIL DOG RAT`);

        });
    }
    catch (err) {

        Sentry.setContext("scan-repositories", {
            message: `scanRepositories attempting to delete Workspace due to transaction error`,
            workspaceId: workspaceId,
        });

        Sentry.captureException(err);
        

        // Try aborting Transaction again, just to be sure, it should have already aborted, but that doesn't seem to happen
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        // End Session to remove locking
        session.endSession();

        // Delete the Workspace to free & reset Repositories
        var backendClient = apis.requestBackendClient();

        try {
            await backendClient.delete(`/workspaces/delete/${workspaceId}`);
        }
        catch (err) {

            Sentry.setContext("scan-repositories", {
                message: `scanRepositories failed to delete Workspace`,
                workspaceId: workspaceId,
            });
    
            Sentry.captureException(err);
            // Don't throw Erorr here, want to make sure Repository delete runs
            throw err;
        }

        await deleteClonedRepositories(clonedRepositoryDiskPaths);
        deletedLocalRepos = true;

    }

    session.endSession();

    if (!deletedLocalRepos) {
        await deleteClonedRepositories(clonedRepositoryDiskPaths);
    }

}

module.exports = {
    scanRepositories
}