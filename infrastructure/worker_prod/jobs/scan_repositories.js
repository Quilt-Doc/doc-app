const fs = require("fs");

const apis = require("../apis/api");


require("dotenv").config();

const constants = require("../constants/index");

const Workspace = require("../models/Workspace");
const Repository = require("../models/Repository");
const Reference = require("../models/Reference");


const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

// const { filterVendorFiles } = require('../utils/validate_utils');

const { scrapeGithubRepoCodeObjects } = require("../utils/commit_scrape");
const { updateRepositoryLastProcessedCommits } = require("../utils/github/commit_utils");
const { generateRepositoryReferences } = require("../utils/references/index");


const { scrapeGithubRepoProjects } = require("../utils/integrations/github_project_utils");
const { scrapeGithubRepoIssues } = require("../utils/integrations/github_issue_utils");

const { cloneInstallationRepo } = require("../utils/github/cli_utils");

const { createInsertHunksForRepository, createPRInsertHunksForRepository } = require("../utils/diffs/index");

const { spawnSync } = require("child_process");

const { printExecTime } = require("../utils/print");



const { setupGithubIssueBoard, generateAssociationsFromResults,
    fetchBoardsFromRepositoryList, addBoardsToWorkspace } = require("../utils/associations/utils");


const { serializeError, deserializeError } = require("serialize-error");

const Sentry = require("@sentry/node");

let db = mongoose.connection;


const deleteClonedRepositories = async (clonedRepositoryDiskPaths) => {
    var repositoryDeleteProcesses = clonedRepositoryDiskPaths.map(async (repoDiskPath) => {

        var timestamp = repoDiskPath.replace("git_repos/", "").replace("/", "");

        spawnSync("rm", ["-rf", `${timestamp}`], { cwd: "./" + "git_repos/" });
    });
    await Promise.allSettled(repositoryDeleteProcesses);
};



const scanRepositories = async () => {

    var worker = require("cluster").worker;

    var workspaceId = process.env.workspaceId;
    var public = process.env.public;

    public = ( public === "true" ) ? true : false;

    var deletedLocalRepos = false;

    var clonedRepositoryDiskPaths = [];

    var repositoryIdToDiskPathMap = {};

    var job_start = process.hrtime();

    var transactionAborted = false;
    var transactionError = { message: "" };
    try {

        // KARAN TODO: Replace this with updated var name
        var installationIdLookup = JSON.parse(process.env.installationIdLookup);
        var repositoryInstallationIds = JSON.parse(process.env.repositoryInstallationIds);

        var repositoryIdList = JSON.parse(process.env.repositoryIdList);

        var urlList;


        var repositoryObjList;

        try {
            var repoFindFilter = { _id: { $in: repositoryIdList }, 
                installationId: (public == true) ? undefined : { $in: repositoryInstallationIds },
            };

            console.log("repoFindFilter: ");
            console.log(repoFindFilter);

            repositoryObjList = await Repository.find(repoFindFilter)
                .lean()
                .exec();
        } catch (err) {

            console.log(err);

            Sentry.setContext("scan-repositories", {
                message: "scanRepositories could not get Repository Objects from MongoDB",
                repositoryInstallationIds: repositoryInstallationIds,
                repositoryIdList: repositoryIdList,
            });

            Sentry.captureException(err);

            throw err;
        }

        console.log(`Found ${repositoryObjList.length} for repositoryObjList: `);


        // Filter out repositories with 'scanned' == true
        var unscannedRepositories = repositoryObjList.filter(repositoryObj => repositoryObj.scanned == false);
        var unscannedRepositoryIdList = unscannedRepositories.map(repositoryObj => repositoryObj._id);

        // Filter out repositories with 'scanned' == false
        var scannedRepositories = repositoryObjList.filter(repositoryObj => repositoryObj.scanned == true);
        var scannedRepositoryIdList = scannedRepositories.map(repositoryObj => repositoryObj._id);

        // Attach IntegrationBoards for all scannedRepositories to workspaceId
        if (scannedRepositoryIdList.length > 0) {
            // Get IntegrationBoards for all Scanned Repositories
            var foundBoards;
            try {
                foundBoards = await fetchBoardsFromRepositoryList(scannedRepositoryIdList);
            } catch (err) {
                Sentry.setContext("scan-repositories", {
                    message: "scanRepositories fetchBoardsFromRepositoryList() failed",
                    workspaceId: workspaceId,
                    scannedRepositoryIdList: JSON.stringify(scannedRepositoryIdList),
                });

                Sentry.captureException(err);
                throw err;
            }

            // Attach fetched IntegrationBoards to Workspace {_id: workspaceId}
            if (foundBoards.length > 0) {
                var foundBoards;
                try {
                    foundBoards = await addBoardsToWorkspace(workspaceId, foundBoards.map(board => board._id));
                } catch (err) {
                    Sentry.setContext("scan-repositories", {
                        message: "scanRepositories addBoardsToWorkspace() failed",
                        workspaceId: workspaceId,
                        foundBoards: JSON.stringify(foundBoards),
                    });
    
                    Sentry.captureException(err);
                    throw err;
                }
            }
            // Must be > 0 fetched IntegrationBoards, otherwise data model in inconsistent state
            else {
                Sentry.setContext("scan-repositories", {
                    message: "scanRepositories fetchBoardsFromRepositoryList() returned 0 IntegrationBoards for Scanned Repositories",
                    workspaceId: workspaceId,
                    scannedRepositoryIdList: JSON.stringify(scannedRepositoryIdList),
                });

                Sentry.captureException(Error("scanRepositories fetchBoardsFromRepositoryList() returned 0 IntegrationBoards for Scanned Repositories"));
                throw Error("scanRepositories fetchBoardsFromRepositoryList() returned 0 IntegrationBoards for Scanned Repositories");

            }
        }

        // If all repositories within this workspace have already been scanned, nothing to do
        if (unscannedRepositories.length == 0) {
            // Set workspace 'setupComplete' to true
            try {
                await Workspace.findByIdAndUpdate(workspaceId, { $set: { setupComplete: true } }).exec();
            } catch (err) {

                Sentry.setContext("scan-repositories", {
                    message: "scanRepositories could not set Workspace.setupComplete = true",
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
            workspaceRepositories = await Repository.updateMany({ _id: { $in: unscannedRepositoryIdList.map(id => ObjectId(id.toString())) }, scanned: false }, { $set: { currentlyScanning: true } });
        } catch (err) {

            Sentry.setContext("scan-repositories", {
                message: "scanRepositories failed updating unscannedRepositories 'currentlyScanning: true'",
                unscannedRepositoryIdList: unscannedRepositoryIdList,
            });

            Sentry.captureException(err);

            throw err;
        }

        var installationClientList;

        if (!(public == true)) {
            try {
                installationClientList = await Promise.all(repositoryInstallationIds.map(async (id) => {
                    return { [id]: await apis.requestInstallationClient(id) };
                }));

                installationClientList = Object.assign({}, ...installationClientList);
            } catch (err) {
                Sentry.setContext("scan-repositories", {
                    message: "scanRepositories failed fetching installationClientList",
                    repositoryInstallationIds: repositoryInstallationIds,
                });

                Sentry.captureException(err);

                throw err;
            }
        }


        // Get Repository objects from github for all unscanned Repositories
        var repositoryListObjects;
        try {
            urlList = unscannedRepositories.map(repositoryObj => {
                return { url: `/repos/${repositoryObj.fullName}`, repositoryId: repositoryObj._id.toString() };
            });
            // fetch the correct installationClient by getting relevant installationId from the repositoryId
            var requestPromiseList = urlList.map(async (urlObj) => {
                if (public == true) {
                    console.log(`Public Client fetching: ${urlObj.url}`);
                    return await apis.requestPublicClient().get(urlObj.url);
                } else {
                    var currentInstallationId = installationIdLookup[urlObj.repositoryId];
                    return await installationClientList[currentInstallationId].get(urlObj.url);
                }
            });

            repositoryListObjects = await Promise.all(requestPromiseList);
        } catch (err) {
            console.log(err);
            console.log("Github API - Can't get Repository Objects");
            Sentry.setContext("scan-repositories", {
                message: "scanRepositories failed fetching Repository objects from Github API - GET \"/repos/:owner/:name/\"",
                urlList: urlList,
            });

            Sentry.captureException(err);

            throw err;
        }

        // Bulk update 'cloneUrl', 'htmlUrl', and 'defaultBranch' fields
        // Update our local list of unscannedRepositories to include the default_branch at the same time
        const bulkFieldUpdateOps = repositoryListObjects.map((repositoryListObjectResponse, idx) => {
            unscannedRepositories[idx].defaultBranch = repositoryListObjectResponse.data.default_branch;
            unscannedRepositories[idx].cloneUrl = repositoryListObjectResponse.data.clone_url;
            unscannedRepositories[idx].htmlUrl = repositoryListObjectResponse.data.html_url;

            return {
                updateOne: {
                    filter: { _id: unscannedRepositories[idx]._id },
                    // Where field is the field you want to update
                    update: {
                        $set: {
                            htmlUrl: repositoryListObjectResponse.data.html_url,
                            cloneUrl: repositoryListObjectResponse.data.clone_url,
                            defaultBranch: repositoryListObjectResponse.data.default_branch,
                        },
                    },
                    upsert: false,
                },
            };
        });

        if (bulkFieldUpdateOps.length > 0) {
            try {
                const bulkResult = await Repository.collection.bulkWrite(bulkFieldUpdateOps);
                console.log(`bulk Repository 'html_url', 'clone_url', 'default_branch' update results: ${JSON.stringify(bulkResult)}`);
            } catch (err) {

                Sentry.setContext("scan-repositories", {
                    message: "scanRepositories failed bulk updating Repository.{html_url, clone_url, default_branch}",
                    unscannedRepositoryIdList: unscannedRepositoryIdList,
                });

                Sentry.captureException(err);

                throw err;
            }
        }


        // Clone all unscannedRepositories and add repoDiskPaths to dictionary

        // Ensure that all timestamps are distinct, just in case duplicate timestamps are generated across Promises
        var initialTimestamp = Date.now();
        var timestampList = unscannedRepositories.map((obj, idx) => {
            return initialTimestamp + idx;
        });

        var repositoryCloneRequestList = unscannedRepositories.map(async (repositoryObj, idx) => {
            var repoDiskPath;
            try {
                var hrstart = process.hrtime();

                console.log(`Attempting to clone Repository ( ${repositoryObj.fullName} )`);
                if (public == true) {
                    repoDiskPath = await cloneInstallationRepo(null, repositoryObj.cloneUrl, false, "", timestampList[idx], true);
                } else {
                    repoDiskPath = await cloneInstallationRepo(repositoryObj.installationId, repositoryObj.cloneUrl, false, "", timestampList[idx]);
                }

                printExecTime(process.hrtime(hrstart), `Repository Clone ( ${repositoryObj.fullName} )`);
                // console.info(`Repository Clone ( ${repositoryObj.fullName} ) Execution time (hr): ${hrend[0]}s ${hrend[1] / 1000000}ms`);

                clonedRepositoryDiskPaths.push(repoDiskPath);
                repositoryIdToDiskPathMap[repositoryObj._id.toString()] = repoDiskPath;
            } catch (err) {

                repositoryIdToDiskPathMap[repositoryObj._id.toString()] = false;

                console.log(err);

                Sentry.setContext("scan-repositories", {
                    message: "cloneInstallationRepo failed",
                    installationId: repositoryObj.installationId,
                    cloneUrl: repositoryObj.cloneUrl,
                });

                Sentry.captureException(err);
                // Throw err here so that Promise.all will fail if all of the Repositories couldn't be cloned
                throw err;
            }
            return { success: true };
        });

        // Execute all requests, don't care about results since will throw err if errors are thrown
        var cloneRepositoryResults;
        try {
            cloneRepositoryResults = await Promise.all(repositoryCloneRequestList);
        } catch (err) {

            Sentry.setContext("scan-repositories", {
                message: "cloneInstallationRepo failed cloning unscanned Repositories",
                unscannedRepositoryIdList: unscannedRepositoryIdList,
            });

            Sentry.captureException(err);

            throw err;
        }

        console.log("clonedRepositoryDiskPaths: ");
        console.log(clonedRepositoryDiskPaths);

        console.log("repositoryIdToDiskPathMap: ");
        console.log(repositoryIdToDiskPathMap);


        console.log("unscannedRepositories: ");
        console.log(unscannedRepositories.map(obj => obj._id.toString()));

        var repositoryCommitsRequestList = unscannedRepositories.map(async (repositoryObj, idx) => {
            try {
                // Get cloned Repository's path
                var repoDiskPath = repositoryIdToDiskPathMap[repositoryObj._id.toString()];

                console.log("scrapeGithubRepoCodeObjects idx: ", idx);

                await scrapeGithubRepoCodeObjects(repositoryObj.installationId,
                    repositoryObj._id.toString(),
                    (public) ? undefined : installationClientList[unscannedRepositories[idx].installationId],
                    repositoryObj,
                    workspaceId,
                    repoDiskPath,
                    public);
            } catch (err) {
                console.log(err);

                Sentry.setContext("scan-repositories", {
                    message: "scanRepositories failed scraping Repository Code Objects",
                    installationId: repositoryObj.installationId,
                    cloneUrl: repositoryObj.cloneUrl,
                });

                Sentry.captureException(err);

                return { error: "Error" };
            }
            return { success: true };
        });

        // Execute all requests
        var commitScrapeListResults;
        try {
            commitScrapeListResults = await Promise.allSettled(repositoryCommitsRequestList);
        } catch (err) {

            Sentry.setContext("scan-repositories", {
                message: "scanRepositories failed scraping Repository Commits",
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
                    integrationBoardId = await setupGithubIssueBoard(workspaceId, repositoryObj._id.toString());

                    await scrapeGithubRepoIssues(repositoryObj.installationId,
                        repositoryObj._id.toString(),
                        repositoryObj,
                        workspaceId,
                        integrationBoardId,
                        public);"";
                } catch (err) {
                    Sentry.captureException(err);
                    console.log(err);
                    return { error: "Error" };
                }
                return { success: true, integrationBoardId: integrationBoardId, repositoryId: repositoryObj._id.toString() };
            });

            // Execute all requests
            var issueScrapeListResults;
            try {
                issueScrapeListResults = await Promise.allSettled(repositoryIssuesRequestList);
            } catch (err) {
                Sentry.setContext("scan-repositories", {
                    message: "scanRepositories failed scraping Repository Issues",
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
            } catch (err) {
                Sentry.captureException(err);
                throw err;
            }

        }


        
        // Generate InsertHunks for each Commit from each unscanned Repository
        var repositoryInsertHunksRequestList = unscannedRepositories.map(async (repositoryObj, idx) => {
            var integrationBoardId;
            try {
                var repoDiskPath = repositoryIdToDiskPathMap[repositoryObj._id.toString()];
                await createInsertHunksForRepository(repoDiskPath, repositoryObj._id.toString());
            }
            catch (err) {

                Sentry.setContext("scan-repositories", {
                    message: `Failed creating InsertHunks`,
                    repoDiskPath: repoDiskPath,
                    repositoryId: repositoryObj._id.toString(),
                });

                Sentry.captureException(err);
                console.log(err);
                return { error: 'Error' };
            }
            return { success: true };
        });

        // Execute all requests
        var insertHunkCreateResults;
        try {
            insertHunkCreateResults = await Promise.allSettled(repositoryInsertHunksRequestList);
        }
        catch (err) {
            Sentry.setContext("scan-repositories", {
                message: `Failed creating InsertHunks`,
                unscannedRepositoryIdList: unscannedRepositoryIdList,
            });

            Sentry.captureException(err);
            throw err;
        }


        /*
        // Generate InsertHunks for each PullRequest from each unscanned Repository
        var repositoryPRInsertHunksRequestList = unscannedRepositories.map(async (repositoryObj) => {
            var currentInstallationId;
            var currentInstallationClient;

            if (!public) {
                currentInstallationId = installationIdLookup[repositoryObj._id.toString()];
                currentInstallationClient = installationClientList[currentInstallationId];
            }

            try {
                await createPRInsertHunksForRepository(repositoryObj._id.toString(), repositoryObj.fullName, currentInstallationClient, public);
            }
            catch (err) {

                Sentry.setContext("scan-repositories", {
                    message: `createPRInsertHunksForRepository failed`,
                    repositoryId: repositoryObj._id.toString(),
                    repositoryFullName: repositoryObj.fullName,
                });

                Sentry.captureException(err);
                console.log(err);
                return { error: 'Error' };
            }
            return { success: true };
        });


        // Execute all PR InsertHunk requests
        var prInsertHunkCreateResults;
        try {
            prInsertHunkCreateResults = await Promise.allSettled(repositoryPRInsertHunksRequestList);
        }
        catch (err) {
            Sentry.setContext("scan-repositories", {
                message: `Failed creating PR InsertHunks`,
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
                    upsert: false,
                },
            };
        });

        if (bulkStatusUpdateOps.length > 0) {
            try {
                const bulkResult = await Repository.collection.bulkWrite(bulkStatusUpdateOps);
                // console.log(`bulk Repository status update results: ${JSON.stringify(bulkResult)}`);
            } catch (err) {

                Sentry.setContext("scan-repositories", {
                    message: "scanRepositories failed bulk updating Repository.{scanned, currentlyScanning}",
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
                    $set: { setupComplete: true },
                    // $pull: {repositories: { $in: repositoriestoRemove.map(id => ObjectId(id))}}
                }
                /*{ session }*/)
                .exec();
        } catch (err) {

            Sentry.setContext("scan-repositories", {
                message: "scanRepositories failed updating Workspace.setupComplete = true",
                repositoriestoRemove: repositoriestoRemove,
            });

            Sentry.captureException(err);

            throw err;
        }


        console.log(`Completed scanning repositories: ${unscannedRepositoryIdList}`);
        printExecTime(process.hrtime(job_start), "scanRepositories Job");


        // throw new Error(`FAIL DOG RAT`);
    } catch (err) {

        Sentry.setContext("scan-repositories", {
            message: "scanRepositories attempting to delete Workspace due to transaction error",
            workspaceId: workspaceId,
        });

        Sentry.captureException(err);

        // Delete the Workspace to free & reset Repositories
        var backendClient = apis.requestBackendClient();

        try {
            await backendClient.delete(`/workspaces/delete/${workspaceId}`);
        } catch (err) {

            Sentry.setContext("scan-repositories", {
                message: "scanRepositories failed to delete Workspace",
                workspaceId: workspaceId,
            });

            Sentry.captureException(err);
            // Don't throw Erorr here, want to make sure Repository delete runs
            throw err;
        }

        await deleteClonedRepositories(clonedRepositoryDiskPaths);
        deletedLocalRepos = true;

    }

    if (!deletedLocalRepos) {
        await deleteClonedRepositories(clonedRepositoryDiskPaths);
    }

};

module.exports = {
    scanRepositories,
};