
const Workspace = require('../models/Workspace');
const Repository = require('../models/Repository');
const Reference = require('../models/Reference');

const Document = require('../models/Document');
const Snippet = require('../models/Snippet');
const Tag = require('../models/Tag');
const WorkspaceInvite = require('../models/authentication/WorkspaceInvite');
const UserStats = require('../models/reporting/UserStats');
const ActivityFeedItem = require('../models/reporting/ActivityFeedItem');
const User = require('../models/authentication/User');


const UserStatsController = require('./reporting/UserStatsController');
const NotificationController = require('./reporting/NotificationController');


const createDocument = require('../controllers/DocumentController').createDocument;

var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const quickScore = require("quick-score").quickScore;

const PAGE_SIZE = 10;

const jobs = require('../apis/jobs');
const jobConstants = require('../constants/index').jobs;

const logger = require('../logging/index').logger;

// grab the Mixpanel factory
const Mixpanel = require('mixpanel');

// create an instance of the mixpanel client
const mixpanel = Mixpanel.init(`${process.env.MIXPANEL_TOKEN}`);

let db = mongoose.connection;


checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true
    }
    return false
}

escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}


createWorkspace = async (req, res) => {
    const {name, creatorId, installationId, repositoryIds } = req.body;

    if (!checkValid(name)) return res.json({success: false, error: 'no workspace name provided'});
    if (!checkValid(installationId)) return res.json({success: false, error: 'no workspace installationId provided'});
    if (!checkValid(creatorId)) return res.json({success: false, error: 'no workspace creatorId provided'});

    const session = await db.startSession();
    let output = {};

    var scanRepositoriesData = {};
    try {
        await session.withTransaction(async () => {

            // Verify that none of the repositories being added exist in any other Workspaces
            var repositoryOverlapExists = false;
            try {
                repositoryOverlapExists = await Workspace.exists({repositories: { $in: repositoryIds.map(repoId => ObjectId(repoId)) }});
            }
            catch (err) {
                await logger.error({source: 'backend-api',
                                    message: err,
                                    errorDescription: `Error checking if Repositories existed in other Workspaces - repositoryIds: ${JSON.stringify(repositoryIds)}`,
                                    function: 'createWorkspace'});

                output = { success: false, error: `Error checking if Repositories existed in other Workspaces`, trace: err };
                throw Error(`Error checking if Repositories existed in other Workspaces`);
            }

            if (repositoryOverlapExists) {

                output = {success: false,
                            alert: "Repository in selection already is part of another Workspace",
                            error: `Cannot attach Repositories to multiple Workspaces`};
                throw Error(`Cannot attach Repositories to multiple Workspaces - repositoryIds: ${JSON.stringify(repositoryIds)}`);
            }

            let workspace = new Workspace({
                name: name,
                creator: ObjectId(creatorId),
                memberUsers: [ObjectId(creatorId)],
                setupComplete: false,
                repositories: repositoryIds.map(repoId => ObjectId(repoId))
            });

            // save workspace
            try {
                workspace = await workspace.save({ session });
            } catch (err) {
                await logger.error({source: 'backend-api', message: err,
                                    errorDescription: `error saving workspace - creator, repositories: ${creatorId}, ${JSON.stringify(repositories)}`,
                                    function: 'createWorkspace'});

                output = { success: false, error: "createWorkspace error: save() on new workspace failed", trace: err };
                throw Error(`error saving workspace - creator, repositories: ${creatorId}, ${JSON.stringify(repositories)}`);
            }

            // Create Root Document
            var document = new Document(
                {
                    author: ObjectId(creatorId),
                    workspace: ObjectId(workspace._id.toString()),
                    title: "",
                    path: "",
                    status: 'valid'
                },
            );

            document.root = true;

            // save document
            try {
                document = await document.save({ session });
            } 
            catch (err) {
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `Create Workspace Error document.save() failed - workspaceId, creatorId, repositories: ${workspace._id.toString()}, ${creatorId}, ${JSON.stringify(repositories)}`,
                                    function: 'createWorkspace'});

                output = {success: false,
                            error: `Create Workspace Error document.save() failed - workspaceId, creatorId, repositories: ${workspace._id.toString()}, ${creatorId}, ${JSON.stringify(repositories)}`,
                            trace: err};

                throw new Error(`Create Workspace Error document.save() failed - workspaceId, creatorId, repositories: ${workspace._id.toString()}, ${creatorId}, ${JSON.stringify(repositories)}`);
            }

            // Update User.workspaces array
            var user;
            try {
                user = await User.findByIdAndUpdate(creatorId, { $push: { workspaces: ObjectId(workspace._id.toString())} }).lean();
            }
            catch (err) {
                await logger.error({source: 'backend-api', message: err,
                                    errorDescription: `Error updating User workspaces array - creatorId, workspaceId: ${creatorId} ${workspace._id.toString()}`,
                                    function: 'createWorkspace'});

                output = {success: false, error: `Error updating User workspaces array - creatorId, workspaceId: ${creatorId} ${workspace._id.toString()}`, trace: err};
                throw Error(`Error updating User workspaces array - creatorId, workspaceId: ${creatorId} ${workspace._id.toString()}`);
            }

            // Create UserStats object for creator
            try {
                // console.log(`CREATING USERSTATS - USER ID: ${creatorId}`);
                await UserStatsController.createUserStats({userId: creatorId, workspaceId: workspace._id.toString(), session});
            }
            catch (err) {
                await logger.error({source: 'backend-api', message: err,
                                    errorDescription: `error creating UserStats object creatorId, workspaceId: ${creatorId} ${workspace._id.toString()}`,
                                    function: 'createWorkspace'});
                output = {success: false, error: `error creating UserStats object creatorId, workspaceId: ${creatorId} ${workspace._id.toString()}`, trace: err};
                throw Error(`error creating UserStats object creatorId, workspaceId: ${creatorId} ${workspace._id.toString()}`);
            }

            // Get the list of installationIds for all Repositories
            var repositoryInstallationIds;
            try {
                repositoryInstallationIds = await Repository.find({ _id: { $in: repositoryIds}, }, '_id installationId', { session }).lean().exec();
            }
            catch (err) {
                await logger.error({source: 'backend-api', message: err,
                                    errorDescription: `error getting workspace repositories - repositoryIds: ${JSON.stringify(repositoryIds)}`,
                                    function: 'createWorkspace'});
                output = {success: false, error: `error getting workspace repositories - repositoryIds: ${JSON.stringify(repositoryIds)}`, trace: err};
                throw Error(`error getting workspace repositories - repositoryIds: ${JSON.stringify(repositoryIds)}`);
            }

            var installationIdLookup = {};
            for (i = 0; i < repositoryInstallationIds.length; i++) {
                installationIdLookup[repositoryInstallationIds[i]._id.toString()] = repositoryInstallationIds[i].installationId.toString()
            }

            
            repositoryInstallationIds = [ ...new Set (repositoryInstallationIds.map(repoObj => repoObj.installationId)) ];

            await logger.info({source: 'backend-api',
                                message: `Scan Repository Job - installationIdLookup, repositoryInstallationIds: ${JSON.stringify(installationIdLookup)}, ${JSON.stringify(repositoryInstallationIds)}`,
                                function: `createWorkspace`});


            // Kick off Scan Repositories Job
            
            scanRepositoriesData['installationIdLookup'] = installationIdLookup;
            scanRepositoriesData['repositoryInstallationIds'] = repositoryInstallationIds;

            scanRepositoriesData['repositoryIdList'] = repositoryIds;
            scanRepositoriesData['workspaceId'] = workspace._id.toString();
            scanRepositoriesData['jobType'] = jobConstants.JOB_SCAN_REPOSITORIES.toString();

            // DEPRECATED
            scanRepositoriesData['installationId'] = installationId;

            // Returning workspace
            // populate workspace
            try {
                workspace = await Workspace.populate(workspace, {path: 'creator repositories memberUsers'});
            } catch (err) {
                await logger.error({source: 'backend-api', message: err,
                                    errorDescription: `error populating workspace - creator, repositories: ${creatorId}, ${JSON.stringify(repositories)}`,
                                    function: 'createWorkspace'});
                output = {success: false, error: "createWorkspace error: workspace population failed", trace: err};
                throw Error(`error populating workspace - creator, repositories: ${creatorId}, ${JSON.stringify(repositories)}`);
            }

            //await logger.info({source: 'backend-api', });

            // track an event with optional properties
            mixpanel.track('Workspace Create', {
                distinct_id: `${creatorId}`,
                name: `${name}`,
                repositoryNumber: `${repositoryIds.length}`,
            });

            output = { success: true, result: workspace };
        });
    }

    catch (err) {
        // Try aborting Transaction again, just to be sure, it should have already aborted, but that doesn't seem to happen
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        // End Session to remove locking
        await session.endSession();

        return res.json(output);
    }

    await session.endSession();

    try {
        await jobs.dispatchScanRepositoriesJob(scanRepositoriesData);
    }

    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `error dispatching scanRepositoriesJob installationId, repositoryIds: ${installationId}, ${JSON.stringify(repositoryIds)}`,
                                function: 'createWorkspace'});
        return res.json({success: false, error: "createWorkspace error: Could not kick off scan repository job", trace: err});
    }

    return res.json(output);
}

getWorkspace = async (req, res) => {
    const workspaceId = req.workspaceObj._id.toString();

    let returnedWorkspace;
    try {
        returnedWorkspace =  await Workspace.findById(workspaceId)
            .populate({path: 'creator repositories memberUsers'}).lean().exec();
    } catch (err) {
        return res.json({success: false, error: "getWorkspace error: workspace findById query failed", trace: err});
    }

    return res.json({success: true, result: returnedWorkspace});
}

// What needs to be deleted:
// All Documents in Workspace
// All Snippets in Workspace
// All Tags in Workspace
// All WorkspaceInvites in Workspace
// All UserStats in Workspace
// All ActivityFeedItems in Workspace

// Remove Workspace from User.workspaces
// Delete Workspace Document

deleteWorkspace = async (req, res) => {

    const workspaceId = req.workspaceObj._id.toString();

    var deletedWorkspace;
    const session = await db.startSession();

    let output = {};

    await logger.info({source: 'backend-api',
                        message: `Attempting to delete Workspace ${workspaceId} - userId: ${req.tokenPayload.userId}`,
                        function: 'deleteWorkspace'});
    try {
        await session.withTransaction(async () => {

            // Delete All Documents
            var deleteDocumentResponse;
            try {
                deleteDocumentResponse = await Document.deleteMany({workspace:  ObjectId(workspaceId)}, { session }).exec();
            }
            catch (err) {
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `deleteWorkspace error: Document deleteMany query failed - workspaceId: ${workspaceId}`,
                                    function: 'deleteWorkspace'});

                output = {success: false, error: `deleteWorkspace error: Document deleteMany query failed - workspaceId: ${workspaceId}`, trace: err};
                throw new Error(`deleteWorkspace error: Document deleteMany query failed - workspaceId: ${workspaceId}`);
            }

            // Delete All Snippets
            var deleteSnippetResponse;
            try {
                deleteSnippetResponse = await Snippet.deleteMany({workspace:  ObjectId(workspaceId)}, { session } ).exec();
            }
            catch (err) {
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `deleteWorkspace error: Snippet deleteMany query failed - workspaceId: ${workspaceId}`,
                                    function: 'deleteWorkspace'});

                output = {success: false, error: `deleteWorkspace error: Snippet deleteMany query failed - workspaceId: ${workspaceId}`, trace: err};
                throw new Error(`deleteWorkspace error: Snippet deleteMany query failed - workspaceId: ${workspaceId}`);
            }


            // Delete All Tags
            var deleteTagResponse;
            try {
                deleteTagResponse = await Tag.deleteMany({workspace:  ObjectId(workspaceId)}, { session } ).exec();
            }
            catch (err) {
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `deleteWorkspace error: Tag deleteMany query failed - workspaceId: ${workspaceId}`,
                                    function: 'deleteWorkspace'});

                output = {success: false, error: `deleteWorkspace error: Tag deleteMany query failed - workspaceId: ${workspaceId}`, trace: err};
                throw new Error(`deleteWorkspace error: Tag deleteMany query failed - workspaceId: ${workspaceId}`);
            }

            // Delete All WorkspaceInvites
            var deleteWorkspaceInviteResponse;
            try {
                deleteWorkspaceInviteResponse = await WorkspaceInvite.deleteMany({workspace:  ObjectId(workspaceId)}, { session }).exec();
            }
            catch (err) {
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `deleteWorkspace error: WorkspaceInvite deleteMany query failed - workspaceId: ${workspaceId}`,
                                    function: 'deleteWorkspace'});

                output = {success: false, error: `deleteWorkspace error: WorkspaceInvite deleteMany query failed - workspaceId: ${workspaceId}`, trace: err};
                throw new Error(`deleteWorkspace error: WorkspaceInvite deleteMany query failed - workspaceId: ${workspaceId}`);
            }

            // Delete All UserStats
            var deleteUserStatsResponse;
            try {
                deleteUserStatsResponse = await UserStats.deleteMany({workspace:  ObjectId(workspaceId)}, { session }).exec();
            }
            catch (err) {
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `deleteWorkspace error: UserStats deleteMany query failed - workspaceId: ${workspaceId}`,
                                    function: 'deleteWorkspace'});

                output = {success: false, error: `deleteWorkspace error: UserStats deleteMany query failed - workspaceId: ${workspaceId}`, trace: err};
                throw new Error(`deleteWorkspace error: UserStats deleteMany query failed - workspaceId: ${workspaceId}`);
            }

            // Delete All ActivityFeedItem
            var deleteActivityFeedItemResponse;
            try {
                deleteActivityFeedItemResponse = await ActivityFeedItem.deleteMany({workspace:  ObjectId(workspaceId)}, { session }).exec();
            }
            catch (err) {
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `deleteWorkspace error: ActivityFeedItem deleteMany query failed - workspaceId: ${workspaceId}`,
                                    function: 'deleteWorkspace'});

                output = {success: false, error: `deleteWorkspace error: ActivityFeedItem deleteMany query failed - workspaceId: ${workspaceId}`, trace: err};
                throw new Error(`deleteWorkspace error: ActivityFeedItem deleteMany query failed - workspaceId: ${workspaceId}`);
            }

            // Remove Workspace from User.workspaces for every user in the workspace
            var removeWorkspaceResponse;
            var usersInWorkspace;
            try {
                usersInWorkspace = await User.find({ workspaces: { $in: [ObjectId(workspaceId)] }}).select('_id').lean().exec();
                usersInWorkspace = usersInWorkspace.map(userObj => userObj._id.toString());

                removeWorkspaceResponse = await User.updateMany({ workspaces:  { $in: [ObjectId(workspaceId)] } },
                                                                { $pull: { workspaces:  { $in: [ObjectId(workspaceId)] } } }, { session }).exec();
            }
            catch (err) {
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `deleteWorkspace error: User remove Workspace updateMany query failed - workspaceId: ${workspaceId}`,
                                    function: 'deleteWorkspace'});

                output = {success: false, error: `deleteWorkspace error: User remove Workspace updateMany query failed - workspaceId: ${workspaceId}`, trace: err};
                throw new Error(`deleteWorkspace error: User remove Workspace updateMany query failed - workspaceId: ${workspaceId}`);
            }

            // Create 'removed_workspace Notifications'
            var notificationData = usersInWorkspace.map(id => {
                return {
                    type: 'removed_workspace',
                    user: id.toString(),
                    workspace: workspaceId,
                }
            });

            // Create 'removed_workspace' Notifications
            try {
                await NotificationController.createRemovedNotifications(notificationData);
            }
            catch (err) {
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `deleteWorkspace error: createdRemovedNotifications failed - workspaceId, usersInWorkspace: ${workspaceId}, ${JSON.stringify(usersInWorkspace)}`,
                                    function: 'deleteWorkspace'});

                output = {success: false,
                            error: `deleteWorkspace error: createdRemovedNotifications failed - workspaceId, usersInWorkspace: ${workspaceId}, ${JSON.stringify(usersInWorkspace)}`,
                            trace: err};
                throw new Error(`deleteWorkspace error: createdRemovedNotifications failed - workspaceId, usersInWorkspace: ${workspaceId}, ${JSON.stringify(usersInWorkspace)}`);
            }


            // Delete Workspace
            try {
                deletedWorkspace = await Workspace.findByIdAndRemove(workspaceId, { session }).select('_id repositories').lean().exec();
            }
            catch (err) {
                console.log(err);
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `deleteWorkspace error: workspace findByIdAndRemove query failed - workspaceId: ${workspaceId}`,
                                    function: 'deleteWorkspace'});

                output = {success: false, error: `deleteWorkspace error: workspace findByIdAndRemove query failed - workspaceId: ${workspaceId}`, trace: err};
                throw new Error(`deleteWorkspace error: workspace findByIdAndRemove query failed - workspaceId: ${workspaceId}`);
            }

            // Set all Repositories in deletedWorkspace.repositories back to 'initRepository state'
            // scanned: false,
            // currentlyScanning: false
            
            console.log('DELETED WORKPSACE: ');
            console.log(deletedWorkspace);

            var initRepositories = deletedWorkspace.repositories.map(repositoryObj => ObjectId(repositoryObj._id.toString()));
            var repositoryInitResponse;
            try {
                repositoryInitResponse = await Repository.updateMany({ _id: { $in: initRepositories } },
                                                                { $set: { scanned: false, currentlyScanning: false } }, { session }).exec();
            }
            catch (err) {
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `deleteWorkspace error: Repository updateMany query failed - workspaceId, initRepositories: ${workspaceId}, ${JSON.stringify(initRepositories)}`,
                                    function: 'deleteWorkspace'});

                output = {success: false, error: `deleteWorkspace error: Repository updateMany query failed - workspaceId, initRepositories: ${workspaceId}, ${JSON.stringify(initRepositories)}`, trace: err};
                throw new Error(`deleteWorkspace error: Repository updateMany query failed - workspaceId, initRepositories: ${workspaceId}, ${JSON.stringify(initRepositories)}`);
            }


            // Delete all References matched by - { repository: { $in: initRepositories.map(id => ObjectId(id.toString())) }, root: false }
            var deleteReferenceResponse;
            try {
                deleteReferenceResponse = await Reference.deleteMany({repository: { $in: initRepositories }, root: false }, { session });
            }
            catch (err) {
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `deleteWorkspace error: Reference deleteMany query failed - workspaceId, initRepositories: ${workspaceId}, ${JSON.stringify(initRepositories)}`,
                                    function: 'deleteWorkspace'});

                output = {success: false, error: `deleteWorkspace error: Reference deleteMany query failed - workspaceId, initRepositories: ${workspaceId}, ${JSON.stringify(initRepositories)}`, trace: err};
                throw new Error(`deleteWorkspace error: Reference deleteMany query failed - workspaceId, initRepositories: ${workspaceId}, ${JSON.stringify(initRepositories)}`);
            }

            await logger.info({source: 'backend-api',
                                message: `Successfully deleted Workspace ${workspaceId} - userId, repositoryIds: ${req.tokenPayload.userId}, ${JSON.stringify(initRepositories)}`,
                                function: 'deleteWorkspace'});

            output = {success: true, result: deletedWorkspace};
            return 
        });
    }
    catch (err) {
        session.endSession();
        return res.json(output);
    }

    session.endSession();

    return res.json(output);

    // return res.json({success: true, result: deletedWorkspace});
}

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

    if (checkValid(userId)) return res.json({success: false, error: 'no user id provided'});

    let returnedWorkspace;

    try {
        returnedWorkspace = await Workspace.findByIdAndUpdate(workspaceId, 
            { $pull: {memberUsers: userId} }, { new: true }).select('_id memberUsers').populate({path: 'user'}).lean.exec();
    } catch (err) {
        await logger.error({source: 'backend-api',
                            error: err,
                            errorDescription: `Error Workspace findByIdAndUpdate query failed - userId, workspaceId: ${userId.toString()}, ${workspaceId}`,
                            function: "removeWorkspaceUser"});

        return res.json({success: false, error: "removeWorkspaceUser error: workspace findByIdAndUpdate query failed", trace: err});
    }

    // Remove from workspaces array on User
    var user;
    try {
        user = await User.findByIdAndUpdate(userId.toString(), { $pull: { workspaces: ObjectId(workspaceId.toString())} }).lean();
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error updating User workspaces array - userId, workspaceId: ${userId.toString()} ${workspaceId.toString()}`,
                            function: 'removeWorkspaceUser'});

        return res.json({success: false,
                        error: `Error updating User workspaces array - userId, workspaceId: ${userId.toString()} ${workspaceId.toString()}`,
                        trace: err});
    }

    // Create 'removed_workspace' Notification
    var notification = {
        type: 'removed_workspace',
        user: userId.toString(),
        workspace: workspaceId
    };
    try {
        await NotificationController.createRemovedNotifications([notification]);
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            error: err,
                            errorDescription: `Error createRemovedNotification failed - userId, workspaceId: ${userId.toString()}, ${workspaceId}`,
                            function: "removeWorkspaceUser"});
        return res.json({success: false, error: `Error createRemovedNotification failed - userId, workspaceId: ${userId.toString()}, ${workspaceId}`, trace: err});
    }

    return res.json({success: true, result: returnedWorkspace});
}

// Check that the JWT userId is in the memberUsers for all workspaces returned
retrieveWorkspaces = async (req, res) => {

    const {name, creatorId, memberUserIds} = req.body;
    const requesterUserId = req.tokenPayload.userId;

    query = Workspace.find();

    if (name) query.where('name').equals(name);
    if (creatorId) query.where('creator').equals(creatorId); 
    if (memberUserIds) query.where('memberUsers').in(memberUserIds);

    let returnedWorkspaces;

    try {
        returnedWorkspaces = await query.populate({path: 'creator memberUsers repositories'}).lean().exec();
    } catch (err) {
        return res.json({success: false, error: "retrieveWorkspaces error: workspace find query failed", trace: err});
    }

    returnedWorkspaces = returnedWorkspaces.filter(currentWorkspace => {
        var currentMemberUsers = currentWorkspace.memberUsers.map(userObj => userObj._id.toString());
        // Only return if requesterUserId is in the memberUsers of the workspace
        return (currentMemberUsers.includes(requesterUserId));
    });

    return res.json({success: true, result: returnedWorkspaces});
}


//FARAZ TODO: Selectively pull content
//FARAZ TODO: Need to place searchFunctions in correct controller and import
//FARAZ TODO: Need to figure out import (or maybe not?)
searchDocuments = async (req, res, searchWorkspace) => {
    const { userQuery, repositoryId, tagIds, returnDocuments, minimalDocuments, includeImage, searchContent,
        referenceIds, creatorIds, docSkip, limit, sort } = req.body;
    
    //console.log("PARAMS", req.body);
    const workspaceId = req.workspaceObj._id.toString();

    if (!returnDocuments) {
        let response = {success: true, result: []};

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
            "autocomplete": {
                    "query": userQuery,
                    "path": "title"
                }
            }];

        // make search for textual content
        if (checkValid(searchContent) && searchContent) shouldFilter.push({
                "text": {
                    "query": userQuery,
                    "path": "content"
                }
            });
        
        documentAggregate = Document.aggregate([
            { 
                $search: {
                    "compound": {
                        "should": shouldFilter,
                        "minimumShouldMatch": 1
                    } 
                }  
            },
        ]);
    } else {
        documentAggregate = Document.aggregate([]);
    }

    documentAggregate.addFields({isDocument: true,  score: { $meta: "searchScore" }});
    
    documentAggregate.match({workspace: ObjectId(workspaceId)});
    
    if (checkValid(repositoryId)) documentAggregate.match({repository: ObjectId(repositoryId)});

    if (checkValid(tagIds)) documentAggregate.match({
        tags: { $in: tagIds.map((tagId) => ObjectId(tagId)) }
    });

    if (checkValid(referenceIds)) documentAggregate.match({
        references: { $in: referenceIds.map((refId) => ObjectId(refId)) }
    });

    if (checkValid(creatorIds)) documentAggregate.match({
        author: { $in: creatorIds.map((creatorId) =>  ObjectId(creatorId)) }
    });
    
    if (checkValid(sort)) documentAggregate.sort(sort);

    if (checkValid(docSkip))  documentAggregate.skip(docSkip);
    
    if (checkValid(limit))  documentAggregate.limit(limit);

    
    let minimalProjectionString = "_id created author title status isDocument";
    let populationString = "author references workspace repository tags";
    
    if (checkValid(minimalDocuments) && minimalDocuments) {
        if (checkValid(includeImage)) minimalProjectionString += " image";
        documentAggregate.project(minimalProjectionString);
        populationString = "author";
    }
    
    try {   
        documents = await documentAggregate.exec();
    } catch(err) {
        let response = { success: false, error: "searchDocuments: Failed to aggregate documents", trace: err};
        if (searchWorkspace) {
            return response;
        } else {
            return res.json(response);
        }
    }
   
    try {
        documents = await Document.populate(documents, 
            {
                path: populationString
            }
        );
    } catch (err) {
        let response = { success: false, error: "searchDocuments: Failed to populate documents", trace: err};
        if (searchWorkspace) {
            return response;
        } else {
            return res.json(response);
        }
    }

    let response = {success: true, result: documents};

    if (searchWorkspace) {
        return response;
    } else {
        return res.json(response);
    }
}

searchReferences = async (req, res, searchWorkspace) => {
    const { userQuery, repositoryId, tagIds, referenceIds,
        returnReferences, minimalReferences, refSkip, limit, sort } = req.body;

    if (!returnReferences) {
        let response = {success: true, result: []};
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
                    "autocomplete": {
                            "query": userQuery,
                            "path": "name"
                    }
                } 
            }
        ]);
    } else {
        referenceAggregate = Reference.aggregate([]);
    }
    
    referenceAggregate.addFields({isReference : true, score: { $meta: "searchScore" }});
    
    referenceAggregate.match({repository: ObjectId(repositoryId)});

    if (checkValid(tagIds)) referenceAggregate.match({
        tags: { $in: tagIds.map((tagId) => ObjectId(tagId)) }
    });

    if (checkValid(referenceIds)) referenceAggregate.match({
        _id: { $in: referenceIds.map((refId) => ObjectId(refId)) }
    });
    
    if (checkValid(sort)) referenceAggregate.sort(sort);

    if (checkValid(refSkip))  referenceAggregate.skip(refSkip);

    if (checkValid(limit))  referenceAggregate.limit(limit);
    
    if (checkValid(minimalReferences) && minimalReferences) referenceAggregate.project("name kind repository path _id created status isReference");

    let populationString = minimalReferences ? "repository tags" : "repository";

    try {
        references = await referenceAggregate.exec()
    } catch (err) {
        let response = { success: false, error: "searchReferences: Failed to aggregate references", trace: err};
        if (searchWorkspace) {
            return response;
        } else {
            return res.json(response);
        }
    }


    try {
        references = await Reference.populate(references, 
            {
                path: populationString
            }
        )
    } catch (err) {
        let response = { success: false, error: "searchReferences: Failed to populate references", trace: err};
        if (searchWorkspace) {
            return response;
        } else {
            return res.json(response);
        }
    }

    // Need to include time filtering
    let response = {success: true, result: references};

    if (searchWorkspace) {
        return response;
    } else {
        return res.json(response);
    }
}

//TODO: Search workspace return values needs to be reflected in reducer
searchWorkspace = async (req, res) => {
    const { userQuery, returnReferences, returnDocuments, limit, sort } = req.body;
    if (!checkValid(userQuery)) return res.json({success: false, result: null, error: 'userQuery: error no userQuery provided.'});
    if (!checkValid(returnReferences)) return res.json({success: false, result: null, error: 'returnReference: error no returnReferences provided.'});
    if (!checkValid(returnDocuments)) return res.json({success: false, result: null, error: 'returnDocuments: error no returnDocuments provided.'});

   
    let documentResponse = await searchDocuments(req, res, true);
  
    if (!documentResponse.success) {
        let {trace, error} = documentResponse;
        return res.json({success: false, error: `searchWorkspace: ${error}`, trace})
    }

    let documents  = documentResponse.result;
    //console.log("DOCS OUTPUT", documents.map(doc => doc.title));

    let referenceResponse = await searchReferences(req, res, true);

    if (!referenceResponse.success) {
        let {trace, error} = referenceResponse;
        return res.json({success: false, error: `searchWorkspace: ${error}`, trace})
    }

    let references = referenceResponse.result;


    let newDocSkip = 0;
    let newRefSkip = 0;

    let finalResult = {}
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
    })

    finalResult = { searchResults, docSkip: newDocSkip, refSkip: newRefSkip };
    return res.json({success: true, result: finalResult});
}

module.exports = {createWorkspace, searchWorkspace, getWorkspace, 
    deleteWorkspace, removeWorkspaceUser, retrieveWorkspaces}
