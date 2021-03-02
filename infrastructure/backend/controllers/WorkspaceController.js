const Workspace = require("../models/Workspace");
const Repository = require("../models/Repository");
const Reference = require("../models/Reference");

const Document = require("../models/Document");
const User = require("../models/authentication/User");

const JiraSite = require("../models/integrations/jira/JiraSite");
const IntegrationBoard = require("../models/integrations/integration_objects/IntegrationBoard");
const IntegrationTicket = require("../models/integrations/integration_objects/IntegrationTicket");
const BoardWorkspaceContext = require('../models/integrations/context/BoardWorkspaceContext');

const Commit = require("../models/Commit");
const PullRequest = require("../models/PullRequest");
const Branch = require("../models/Branch");

const apis = require("../apis/api");

const UserStatsController = require("./reporting/UserStatsController");
const NotificationController = require("./reporting/NotificationController");

const createDocument = require("../controllers/DocumentController")
    .createDocument;

var mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const quickScore = require("quick-score").quickScore;

const PAGE_SIZE = 10;

const jobs = require("../apis/jobs");
const jobConstants = require("../constants/index").jobs;

const logger = require("../logging/index").logger;

//sentry
const Sentry = require("@sentry/node");

// grab the Mixpanel factory
const Mixpanel = require("mixpanel");

// create an instance of the mixpanel client
const mixpanel = Mixpanel.init(`${process.env.MIXPANEL_TOKEN}`);

let db = mongoose.connection;

const { checkValid } = require("../utils/utils");

escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

const getScanRepositoriesData = async (repositoryIds, workspace, session, logger ) => {
    // Get the list of installationIds for all Repositories
    var repositoryInstallationIds;
    try {
        repositoryInstallationIds = await Repository.find(
            { _id: { $in: repositoryIds } },
            "_id fullName installationId",
            { session }
        )
            .lean()
            .exec();
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `error getting workspace repositories - repositoryIds: ${JSON.stringify(
                repositoryIds
            )}`,
            function: "getScanRepositoriesData",
        });
        throw Error(
            `error getting workspace repositories - repositoryIds: ${JSON.stringify(repositoryIds)}`
        );
    }

    var installationIdLookup = {};
    for (i = 0; i < repositoryInstallationIds.length; i++) {
        installationIdLookup[
            repositoryInstallationIds[i]._id.toString()
        ] = repositoryInstallationIds[i].installationId.toString();
    }

    repositoryInstallationIds = [
        ...new Set(
            repositoryInstallationIds.map(
                (repoObj) => repoObj.installationId
            )
        ),
    ];

    await logger.info({
        source: "backend-api",
        message: `Scan Repository Job - installationIdLookup, repositoryInstallationIds: ${JSON.stringify(installationIdLookup)}, ${JSON.stringify(repositoryInstallationIds)}`,
        function: `getScanRepositoriesData`,
    });

    // Kick off Scan Repositories Job

    var scanRepositoriesData = {};

    scanRepositoriesData["installationIdLookup"] = installationIdLookup;
    scanRepositoriesData["repositoryInstallationIds"] = repositoryInstallationIds;

    scanRepositoriesData["repositoryIdList"] = repositoryIds;
    scanRepositoriesData["workspaceId"] = workspace._id.toString();
    scanRepositoriesData["jobType"] = jobConstants.JOB_SCAN_REPOSITORIES.toString();


    return scanRepositoriesData;

}



createWorkspace = async (req, res) => {
    const { name, creatorId, installationId, repositoryIds } = req.body;

    console.log({ name, creatorId, installationId, repositoryIds });

    if (!checkValid(name))
        return res.json({
            success: false,
            error: "no workspace name provided",
        });
    if (!checkValid(installationId))
        return res.json({
            success: false,
            error: "no workspace installationId provided",
        });
    if (!checkValid(creatorId))
        return res.json({
            success: false,
            error: "no workspace creatorId provided",
        });

    const session = await db.startSession();
    let output = {};

    console.log('Beginning to create workspace');

    var scanRepositoriesData = {};
    try {
        await session.withTransaction(async () => {

            let workspace = new Workspace({
                name: name,
                creator: ObjectId(creatorId),
                memberUsers: [ObjectId(creatorId)],
                setupComplete: false,
                repositories: repositoryIds.map((repoId) => ObjectId(repoId)),
            });

            // save workspace
            try {
                workspace = await workspace.save({ session });
            } catch (err) {
                console.log(err);
                await logger.error({
                    source: "backend-api",
                    message: err,
                    errorDescription: `error saving workspace - creator, repositories: ${creatorId}, ${JSON.stringify(
                        repositories
                    )}`,
                    function: "createWorkspace",
                });

                output = {
                    success: false,
                    error:
                        "createWorkspace error: save() on new workspace failed",
                    trace: err,
                };
                throw Error(
                    `error saving workspace - creator, repositories: ${creatorId}, ${JSON.stringify(
                        repositories
                    )}`
                );
            }

            // Update User.workspaces array
            var user;
            try {
                user = await User.findByIdAndUpdate(creatorId, {
                    $push: { workspaces: ObjectId(workspace._id.toString()) },
                }).lean();
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    message: err,
                    errorDescription: `Error updating User workspaces array - creatorId, workspaceId: ${creatorId} ${workspace._id.toString()}`,
                    function: "createWorkspace",
                });

                output = {
                    success: false,
                    error: `Error updating User workspaces array - creatorId, workspaceId: ${creatorId} ${workspace._id.toString()}`,
                    trace: err,
                };
                throw Error(
                    `Error updating User workspaces array - creatorId, workspaceId: ${creatorId} ${workspace._id.toString()}`
                );
            }


            // Create Root Document
            var document = new Document({
                author: ObjectId(creatorId),
                workspace: ObjectId(workspace._id.toString()),
                title: "",
                path: "",
                status: "valid",
            });

            document.root = true;

            // save document
            try {
                document = await document.save({ session });
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `Create Workspace Error document.save() failed - workspaceId, creatorId, repositories: ${workspace._id.toString()}, ${creatorId}, ${JSON.stringify(
                        repositories
                    )}`,
                    function: "createWorkspace",
                });

                output = {
                    success: false,
                    error: `Create Workspace Error document.save() failed - workspaceId, creatorId, repositories: ${workspace._id.toString()}, ${creatorId}, ${JSON.stringify(
                        repositories
                    )}`,
                    trace: err,
                };

                throw new Error(
                    `Create Workspace Error document.save() failed - workspaceId, creatorId, repositories: ${workspace._id.toString()}, ${creatorId}, ${JSON.stringify(
                        repositories
                    )}`
                );
            }


            // Get data necessary for Job
            try {
                scanRepositoriesData = await getScanRepositoriesData(repositoryIds, workspace, session, logger);
            }
            catch (err) {
                await logger.error({
                    source: "backend-api",
                    message: err,
                    errorDescription: `Error getScanRepositoriesData failed - repositoryIds: ${JSON.stringify(repositoryIds)}`,
                    function: "createWorkspace",
                });

                output = {
                    success: false,
                    error: `Error getScanRepositoriesData failed - repositoryIds: ${JSON.stringify(repositoryIds)}`,
                    trace: err,
                };
                throw Error(
                    `Error getScanRepositoriesData failed - repositoryIds: ${JSON.stringify(repositoryIds)}`
                );
            }


            // Returning workspace
            // populate workspace
            try {
                workspace = await Workspace.populate(workspace, {
                    path: "creator repositories memberUsers",
                });
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    message: err,
                    errorDescription: `error populating workspace - creator, repositories: ${creatorId}, ${JSON.stringify(
                        repositories
                    )}`,
                    function: "createWorkspace",
                });
                output = {
                    success: false,
                    error: "createWorkspace error: workspace population failed",
                    trace: err,
                };
                throw Error(
                    `error populating workspace - creator, repositories: ${creatorId}, ${JSON.stringify(
                        repositories
                    )}`
                );
            }


            output = { success: true, result: workspace };
        });
    } catch (err) {
        // Try aborting Transaction again, just to be sure, it should have already aborted, but that doesn't seem to happen
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        // End Session to remove locking
        await session.endSession();


        console.log(err);
        return res.json(output);
    }

    await session.endSession();

    try {
        await jobs.dispatchScanRepositoriesJob(scanRepositoriesData);
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `error dispatching scanRepositoriesJob installationId, repositoryIds: ${installationId}, ${JSON.stringify(
                repositoryIds
            )}`,
            function: "createWorkspace",
        });
        return res.json({
            success: false,
            error:
                "createWorkspace error: Could not kick off scan repository job",
            trace: err,
        });
    }

    return res.json(output);
};

getWorkspace = async (req, res) => {
    const workspaceId = req.workspaceObj._id.toString();

    let returnedWorkspace;
    try {
        returnedWorkspace = await Workspace.findById(workspaceId)
            .populate({ path: "creator repositories memberUsers" })
            .lean()
            .exec();
    } catch (err) {
        return res.json({
            success: false,
            error: "getWorkspace error: workspace findById query failed",
            trace: err,
        });
    }

    return res.json({ success: true, result: returnedWorkspace });
};

// What needs to be deleted:
// All Documents in Workspace
// All Snippets in Workspace
// All Tags in Workspace
// All WorkspaceInvites in Workspace
// All UserStats in Workspace
// All ActivityFeedItems in Workspace

// Remove Workspace from User.workspaces
// Delete Workspace Document

// TODO:
// IntegrationBoards ( github projects ) -- delete all IntegrationBoards(source = "github") from Repositories on the Workspace

// JiraSite -- has a workspaceId attached
// IntegrationBoards ( jira projects) -- Could use the Ids of all the JiraSites found to be deleted in the prior step

// IntegrationTicket -- has a workspaceId attached



deleteWorkspace = async (req, res) => {
    const workspaceId = req.workspaceObj._id.toString();

    var deletedWorkspace;
    const session = await db.startSession();

    let output = {};

    await logger.info({
        source: "backend-api",
        message: `Attempting to delete Workspace ${workspaceId} - userId: ${req.tokenPayload.userId}`,
        function: "deleteWorkspace",
    });
    try {
        await session.withTransaction(async () => {

            // Remove Workspace from User.workspaces for every user in the workspace
            var removeWorkspaceResponse;
            var usersInWorkspace;
            try {
                usersInWorkspace = await User.find({
                    workspaces: { $in: [ObjectId(workspaceId)] },
                })
                    .select("_id")
                    .lean()
                    .exec();
                usersInWorkspace = usersInWorkspace.map((userObj) =>
                    userObj._id.toString()
                );

                removeWorkspaceResponse = await User.updateMany(
                    { workspaces: { $in: [ObjectId(workspaceId)] } },
                    { $pull: { workspaces: { $in: [ObjectId(workspaceId)] } } },
                    { session }
                ).exec();
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteWorkspace error: User remove Workspace updateMany query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteWorkspace error: User remove Workspace updateMany query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteWorkspace error: User remove Workspace updateMany query failed - workspaceId: ${workspaceId}`
                );
            }


            // Delete Workspace
            try {
                deletedWorkspace = await Workspace.findByIdAndRemove(
                    workspaceId,
                    { session }
                )
                    .select("_id repositories")
                    .lean()
                    .exec();
            } catch (err) {
                console.log(err);
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteWorkspace error: workspace findByIdAndRemove query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteWorkspace error: workspace findByIdAndRemove query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteWorkspace error: workspace findByIdAndRemove query failed - workspaceId: ${workspaceId}`
                );
            }


            // Reset Repositories if Repository doesn't exist on any other Workspace
            var initRepositories = deletedWorkspace.repositories.map(
                (repositoryObj) => ObjectId(repositoryObj._id.toString())
            );
            var repositoryInitResponse;
            var repositoryWorkspaces;
            var repositoriesToDelete = [];

            var workspaceRepositories = deletedWorkspace.repositories;

            var foundRepositories = new Set();

            try {

                repositoryWorkspaces = await Workspace.find({repositories: { $in: workspaceRepositories.map(id => ObjectId(id.toString())) }}, 'repositories', { session })
                                                        .lean()
                                                        .exec();

                var i = 0;
                var currentWorkspace;
                for (i = 0; i < repositoryWorkspaces.length; i++) {
                    currentWorkspace = repositoryWorkspaces[i];
                    var k = 0;
                    for (k = 0; k < currentWorkspace.repositories; k++) {
                        foundRepositories.add(currentWorkspace.repositories[k]);
                    }
                }

                for (i = 0; i < workspaceRepositories.length; i++) {
                    if (!foundRepositories.has(workspaceRepositories[i])) {
                        repositoriesToDelete.push(workspaceRepositories[i]);
                    }
                }

                // Delete all PullRequests, Commits, Branches, GithubIssues for repositoriesToDelete
                if (repositoriesToDelete.length > 0) {


                    // Delete Repository Commits
                    try {
                        await Commit.deleteMany( { repository: { $in: repositoriesToDelete.map(id => ObjectId(id.toString())) } }, { session })
                                    .exec();
                    }
                    catch (err) {
                        console.log(err);
                        await logger.error({
                            source: "backend-api",
                            error: err,
                            errorDescription: `deleteWorkspace error: Commit deleteMany query failed - workspaceId, repositoriesToDelete: ${workspaceId}, ${JSON.stringify(repositoriesToDelete)}`,
                            function: "deleteWorkspace",
                        });
        
                        throw new Error(`deleteWorkspace error: Commit deleteMany query failed - workspaceId, repositoriesToDelete: ${workspaceId}, ${JSON.stringify(repositoriesToDelete)}`);
                    }

                    // Delete Repository PullRequests
                    try {
                        await PullRequest.deleteMany( { repository: { $in: repositoriesToDelete.map(id => ObjectId(id.toString())) } }, { session })
                                    .exec();

                    }
                    catch (err) {
                        console.log(err);
                        await logger.error({
                            source: "backend-api",
                            error: err,
                            errorDescription: `deleteWorkspace error: PullRequest deleteMany query failed - workspaceId, repositoriesToDelete: ${workspaceId}, ${JSON.stringify(repositoriesToDelete)}`,
                            function: "deleteWorkspace",
                        });
        
                        throw new Error(`deleteWorkspace error: PullRequest deleteMany query failed - workspaceId, repositoriesToDelete: ${workspaceId}, ${JSON.stringify(repositoriesToDelete)}`);
                    }


                    // Delete Repository Branches
                    try {
                        await Branch.deleteMany( { repository: { $in: repositoriesToDelete.map(id => ObjectId(id.toString())) } }, { session })
                                    .exec();
                    }
                    catch (err) {
                        console.log(err);
                        await logger.error({
                            source: "backend-api",
                            error: err,
                            errorDescription: `deleteWorkspace error: Branch deleteMany query failed - workspaceId, repositoriesToDelete: ${workspaceId}, ${JSON.stringify(repositoriesToDelete)}`,
                            function: "deleteWorkspace",
                        });
        
                        throw new Error(`deleteWorkspace error: Branch deleteMany query failed - workspaceId, repositoriesToDelete: ${workspaceId}, ${JSON.stringify(repositoriesToDelete)}`);
                    }

                    // Delete Repository Github Issues & Cards
                    try {
                        await IntegrationTicket.deleteMany( { source: 'github', repositoryId: { $in: repositoriesToDelete.map(id => ObjectId(id.toString())) } }, { session })
                                    .exec();
                    }
                    catch (err) {
                        console.log(err);
                        await logger.error({
                            source: "backend-api",
                            error: err,
                            errorDescription: `deleteWorkspace error: IntegrationTicket deleteMany query failed - workspaceId, repositoriesToDelete: ${workspaceId}, ${JSON.stringify(repositoriesToDelete)}`,
                            function: "deleteWorkspace",
                        });
        
                        throw new Error(`deleteWorkspace error: IntegrationTicket deleteMany query failed - workspaceId, repositoriesToDelete: ${workspaceId}, ${JSON.stringify(repositoriesToDelete)}`);
                    }

                    // Delete GithubProjects
                    var deleteGithubProjectsResponse;
                    try {
                        deleteGithubProjectsResponse = await IntegrationBoard.deleteMany({ repositoryId: { $in: repositoriesToDelete.map((id) => ObjectId(id.toString())) }, }, { session })
                                                                                .exec();
                    } catch (err) {
                        console.log(err);
                        await logger.error({
                            source: "backend-api",
                            error: err,
                            errorDescription: `deleteWorkspace error: IntegrationBoards deleteMany query failed - workspaceId: ${workspaceId}`,
                            function: "deleteWorkspace",
                        });
        
                        throw new Error(
                            `deleteWorkspace error: IntegrationBoards deleteMany query failed - workspaceId: ${workspaceId}`
                        );
                    }
                }

                // Reset Repositories 
                repositoryInitResponse = await Repository.updateMany( { _id: { $in: repositoriesToDelete } }, { $set: { scanned: false, currentlyScanning: false } }, { session })
                                                            .exec();
            }
            catch (err) {
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteWorkspace error: Repository updateMany query failed - workspaceId, initRepositories: ${workspaceId}, ${JSON.stringify(
                        initRepositories
                    )}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteWorkspace error: Repository updateMany query failed - workspaceId, initRepositories: ${workspaceId}, ${JSON.stringify(
                        initRepositories
                    )}`,
                    trace: err,
                };
                throw new Error(
                    `deleteWorkspace error: Repository updateMany query failed - workspaceId, initRepositories: ${workspaceId}, ${JSON.stringify(
                        initRepositories
                    )}`
                );
            }


            // FindBoardWorkspaceContexts to delete
            var boardWorkspaceContextsToDelete;

            try {
                boardWorkspaceContextsToDelete = await BoardWorkspaceContext.find({workspace: ObjectId(deletedWorkspace._id.toString())}, null, { session }).exec();
            }
            catch (err) {
                console.log(err);

                output = {
                    success: false,
                    error: `deleteWorkspace error: BoardWorkspaceContext find query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteWorkspace error: BoardWorkspaceContext find query failed - workspaceId: ${workspaceId}`
                );
            }

            // Delete all BoardWorkspaceContexts

            try {
                await BoardWorkspaceContext.deleteMany({workspace: ObjectId(deletedWorkspace._id.toString())}, { session }).exec();
            }
            catch (err) {
                console.log(err);
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteWorkspace error: BoardWorkspaceContext deleteMany query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteWorkspace error: BoardWorkspaceContext deleteMany query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteWorkspace error: BoardWorkspaceContext deleteMany query failed - workspaceId: ${workspaceId}`
                );
            }

            /*
            // Find All IntegrationBoards to Remove
            var integrationBoardContexts = [];
            var allIntegrationBoards = [];

            for (i = 0; i < boardWorkspaceContextsToDelete.length; i++) {
                allIntegrationBoards.push(boardWorkspaceContextsToDelete.board); 
            }

            try {
                integrationBoardContexts
            }
            catch (err) {

            }
            */


            // Unset all repositoryId fields for IntegrationAttachments on repositoriesToDelete



        });
    }
    catch (err) {
        session.endSession();
        return res.json(output);
    }

    session.endSession();

    return res.json(output);

    // return res.json({success: true, result: deletedWorkspace});
};


/*
// Put request
// Population only on returns
addWorkspaceUser = async (req, res) => {
    const workspaceId = req.workspaceObj._id.toString();
    const { userId } = req.params;

    if (checkValid(userId)) return res.json({success: false, error: 'no user id provided'});

    let returnedWorkspace;

    try {
        returnedWorkspace = await Workspace.findByIdAndUpdate(workspaceId, 
            { $push: {memberUsers: userId} }, { new: true }).select('_id memberUsers').populate({path: 'user'}).lean.exec();
    } catch (err) {
        return res.json({success: false, error: "addUser error: workspace findByIdAndUpdate query failed", trace: err});
    }

    // Create UserStats object for creator
    try {
        await UserStatsController.createUserStats({userId, workspaceId});
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `error creating UserStats object userId, workspaceId: ${userId} ${workspaceId}`,
                            function: 'addWorkspaceUser'});
        return res.json({success: false, error: `error creating UserStats object userId, workspaceId: ${userId} ${workspaceId}`, trace: err});
    }

    return res.json({success: true, result: returnedWorkspace});
}
*/

removeWorkspaceUser = async (req, res) => {
    const workspaceId = req.workspaceObj._id.toString();
    const { userId } = req.params;

    if (checkValid(userId))
        return res.json({ success: false, error: "no user id provided" });

    let returnedWorkspace;

    try {
        returnedWorkspace = await Workspace.findByIdAndUpdate(
            workspaceId,
            { $pull: { memberUsers: userId } },
            { new: true }
        )
            .select("_id memberUsers")
            .populate({ path: "user" })
            .lean.exec();
    } catch (err) {
        await logger.error({
            source: "backend-api",
            error: err,
            errorDescription: `Error Workspace findByIdAndUpdate query failed - userId, workspaceId: ${userId.toString()}, ${workspaceId}`,
            function: "removeWorkspaceUser",
        });

        return res.json({
            success: false,
            error:
                "removeWorkspaceUser error: workspace findByIdAndUpdate query failed",
            trace: err,
        });
    }

    // Remove from workspaces array on User
    var user;
    try {
        user = await User.findByIdAndUpdate(userId.toString(), {
            $pull: { workspaces: ObjectId(workspaceId.toString()) },
        }).lean();
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error updating User workspaces array - userId, workspaceId: ${userId.toString()} ${workspaceId.toString()}`,
            function: "removeWorkspaceUser",
        });

        return res.json({
            success: false,
            error: `Error updating User workspaces array - userId, workspaceId: ${userId.toString()} ${workspaceId.toString()}`,
            trace: err,
        });
    }

    // Create 'removed_workspace' Notification
    var notification = {
        type: "removed_workspace",
        user: userId.toString(),
        workspace: workspaceId,
    };
    try {
        await NotificationController.createRemovedNotifications([notification]);
    } catch (err) {
        await logger.error({
            source: "backend-api",
            error: err,
            errorDescription: `Error createRemovedNotification failed - userId, workspaceId: ${userId.toString()}, ${workspaceId}`,
            function: "removeWorkspaceUser",
        });
        return res.json({
            success: false,
            error: `Error createRemovedNotification failed - userId, workspaceId: ${userId.toString()}, ${workspaceId}`,
            trace: err,
        });
    }

    return res.json({ success: true, result: returnedWorkspace });
};

// Check that the JWT userId is in the memberUsers for all workspaces returned
retrieveWorkspaces = async (req, res) => {
    const { name, creatorId, memberUserIds } = req.body;
    const requesterUserId = req.tokenPayload.userId;

    query = Workspace.find();

    if (name) query.where("name").equals(name);
    if (creatorId) query.where("creator").equals(creatorId);
    if (memberUserIds) query.where("memberUsers").in(memberUserIds);

    let returnedWorkspaces;

    try {
        returnedWorkspaces = await query
            .populate({ path: "creator memberUsers repositories" })
            .lean()
            .exec();
    } catch (err) {
        return res.json({
            success: false,
            error: "retrieveWorkspaces error: workspace find query failed",
            trace: err,
        });
    }

    returnedWorkspaces = returnedWorkspaces.filter((currentWorkspace) => {
        var currentMemberUsers = currentWorkspace.memberUsers.map((userObj) =>
            userObj._id.toString()
        );
        // Only return if requesterUserId is in the memberUsers of the workspace
        return currentMemberUsers.includes(requesterUserId);
    });

    return res.json({ success: true, result: returnedWorkspaces });
};

//FARAZ TODO: Selectively pull content
//FARAZ TODO: Need to place searchFunctions in correct controller and import
//FARAZ TODO: Need to figure out import (or maybe not?)
searchDocuments = async (req, res, searchWorkspace) => {
    const {
        userQuery,
        repositoryId,
        tagIds,
        returnDocuments,
        minimalDocuments,
        includeImage,
        searchContent,
        referenceIds,
        creatorIds,
        docSkip,
        limit,
        sort,
    } = req.body;

    //console.log("PARAMS", req.body);
    const workspaceId = req.workspaceObj._id.toString();

    if (!returnDocuments) {
        let response = { success: true, result: [] };

        if (searchWorkspace) {
            return response;
        } else {
            return res.json(response);
        }
    }

    let documentAggregate;

    if (checkValid(userQuery) && userQuery !== "") {
        // make search for title
        let shouldFilter = [
            {
                autocomplete: {
                    query: userQuery,
                    path: "title",
                },
            },
        ];

        // make search for textual content
        if (checkValid(searchContent) && searchContent)
            shouldFilter.push({
                text: {
                    query: userQuery,
                    path: "content",
                },
            });

        documentAggregate = Document.aggregate([
            {
                $search: {
                    compound: {
                        should: shouldFilter,
                        minimumShouldMatch: 1,
                    },
                },
            },
        ]);
    } else {
        documentAggregate = Document.aggregate([]);
    }

    documentAggregate.addFields({
        isDocument: true,
        score: { $meta: "searchScore" },
    });

    documentAggregate.match({ workspace: ObjectId(workspaceId) });

    if (checkValid(repositoryId))
        documentAggregate.match({ repository: ObjectId(repositoryId) });

    if (checkValid(tagIds))
        documentAggregate.match({
            tags: { $in: tagIds.map((tagId) => ObjectId(tagId)) },
        });

    if (checkValid(referenceIds))
        documentAggregate.match({
            references: { $in: referenceIds.map((refId) => ObjectId(refId)) },
        });

    if (checkValid(creatorIds))
        documentAggregate.match({
            author: { $in: creatorIds.map((creatorId) => ObjectId(creatorId)) },
        });

    if (checkValid(sort)) documentAggregate.sort(sort);

    if (checkValid(docSkip)) documentAggregate.skip(docSkip);

    if (checkValid(limit)) documentAggregate.limit(limit);

    let minimalProjectionString = "_id created author title status isDocument";
    let populationString = "author references workspace repository tags";

    if (checkValid(minimalDocuments) && minimalDocuments) {
        if (checkValid(includeImage)) minimalProjectionString += " image";
        documentAggregate.project(minimalProjectionString);
        populationString = "author";
    }

    try {
        documents = await documentAggregate.exec();
    } catch (err) {
        let response = {
            success: false,
            error: "searchDocuments: Failed to aggregate documents",
            trace: err,
        };
        if (searchWorkspace) {
            return response;
        } else {
            return res.json(response);
        }
    }

    try {
        documents = await Document.populate(documents, {
            path: populationString,
        });
    } catch (err) {
        let response = {
            success: false,
            error: "searchDocuments: Failed to populate documents",
            trace: err,
        };
        if (searchWorkspace) {
            return response;
        } else {
            return res.json(response);
        }
    }

    let response = { success: true, result: documents };

    if (searchWorkspace) {
        return response;
    } else {
        return res.json(response);
    }
};

searchReferences = async (req, res, searchWorkspace) => {
    const {
        userQuery,
        repositoryId,
        tagIds,
        referenceIds,
        returnReferences,
        minimalReferences,
        refSkip,
        limit,
        sort,
    } = req.body;

    if (!returnReferences) {
        let response = { success: true, result: [] };
        if (searchWorkspace) {
            return response;
        } else {
            return res.json(response);
        }
    }

    let referenceAggregate;

    if (checkValid(userQuery) && userQuery !== "") {
        referenceAggregate = Reference.aggregate([
            {
                $search: {
                    autocomplete: {
                        query: userQuery,
                        path: "name",
                    },
                },
            },
        ]);
    } else {
        referenceAggregate = Reference.aggregate([]);
    }

    referenceAggregate.addFields({
        isReference: true,
        score: { $meta: "searchScore" },
    });

    referenceAggregate.match({ repository: ObjectId(repositoryId) });

    if (checkValid(tagIds))
        referenceAggregate.match({
            tags: { $in: tagIds.map((tagId) => ObjectId(tagId)) },
        });

    if (checkValid(referenceIds))
        referenceAggregate.match({
            _id: { $in: referenceIds.map((refId) => ObjectId(refId)) },
        });

    if (checkValid(sort)) referenceAggregate.sort(sort);

    if (checkValid(refSkip)) referenceAggregate.skip(refSkip);

    if (checkValid(limit)) referenceAggregate.limit(limit);

    if (checkValid(minimalReferences) && minimalReferences)
        referenceAggregate.project(
            "name kind repository path _id created status isReference"
        );

    let populationString = minimalReferences ? "repository tags" : "repository";

    try {
        references = await referenceAggregate.exec();
    } catch (err) {
        let response = {
            success: false,
            error: "searchReferences: Failed to aggregate references",
            trace: err,
        };
        if (searchWorkspace) {
            return response;
        } else {
            return res.json(response);
        }
    }

    try {
        references = await Reference.populate(references, {
            path: populationString,
        });
    } catch (err) {
        let response = {
            success: false,
            error: "searchReferences: Failed to populate references",
            trace: err,
        };
        if (searchWorkspace) {
            return response;
        } else {
            return res.json(response);
        }
    }

    // Need to include time filtering
    let response = { success: true, result: references };

    if (searchWorkspace) {
        return response;
    } else {
        return res.json(response);
    }
};

//TODO: Search workspace return values needs to be reflected in reducer
searchWorkspace = async (req, res) => {
    const {
        userQuery,
        returnReferences,
        returnDocuments,
        limit,
        sort,
    } = req.body;
    if (!checkValid(userQuery))
        return res.json({
            success: false,
            result: null,
            error: "userQuery: error no userQuery provided.",
        });
    if (!checkValid(returnReferences))
        return res.json({
            success: false,
            result: null,
            error: "returnReference: error no returnReferences provided.",
        });
    if (!checkValid(returnDocuments))
        return res.json({
            success: false,
            result: null,
            error: "returnDocuments: error no returnDocuments provided.",
        });

    let documentResponse = await searchDocuments(req, res, true);

    if (!documentResponse.success) {
        let { trace, error } = documentResponse;
        return res.json({
            success: false,
            error: `searchWorkspace: ${error}`,
            trace,
        });
    }

    let documents = documentResponse.result;
    //console.log("DOCS OUTPUT", documents.map(doc => doc.title));

    let referenceResponse = await searchReferences(req, res, true);

    if (!referenceResponse.success) {
        let { trace, error } = referenceResponse;
        return res.json({
            success: false,
            error: `searchWorkspace: ${error}`,
            trace,
        });
    }

    let references = referenceResponse.result;

    let newDocSkip = 0;
    let newRefSkip = 0;

    let finalResult = {};
    // NEED TO INCLUDE PROPER SORTING ON MIX
    searchResults = [...documents, ...references];
    //console.log(searchResults);
    /*
    if (sort) {
        searchResults.sort((a, b) => {
            if (a.created.getTime() > b.created.getTime()) {
                return -1
            } else {
                return 1
            }
        })
    }*/

    searchResults = searchResults.slice(0, limit);

    searchResults.map((seResult) => {
        if (seResult.isDocument) {
            newDocSkip += 1;
        } else if (seResult.isReference) {
            newRefSkip += 1;
        }
    });

    finalResult = { searchResults, docSkip: newDocSkip, refSkip: newRefSkip };
    return res.json({ success: true, result: finalResult });
};

editWorkspace = async (req, res) => {
    const { workspaceId } = req.params;

    const { name } = req.body;

    console.log("ENTERED TO EDIT WORKSPACE");

    const update = {};

    if (checkValid(name) && name != "") {
        if (name == "") {
            return res.json({
                success: false,
                message: "Workspace name cannot be empty.",
            });
        }

        update.name = name;
    }

    let returnedWorkspace;

    try {
        returnedWorkspace = await Workspace.findByIdAndUpdate(
            workspaceId,
            { $set: update },
            { new: true }
        )
            .select("name _id")
            .lean()
            .exec();
    } catch (e) {
        Sentry.captureException(e);

        return res.json({
            success: false,
            error:
                "editWorkspace: Failed to update workspace during Mongo Query",
            trace: e,
        });
    }

    return res.json({
        success: true,
        result: returnedWorkspace,
    });
};

module.exports = {
    createWorkspace,
    searchWorkspace,
    getWorkspace,
    deleteWorkspace,
    removeWorkspaceUser,
    retrieveWorkspaces,
    editWorkspace,
};
