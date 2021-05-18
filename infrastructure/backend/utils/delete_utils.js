const User = require("../models/authentication/User");
const Workspace = require("../models/Workspace");
const Repository = require("../models/Repository");

const Commit = require("../models/Commit");
const PullRequest = require("../models/PullRequest");
const Branch = require("../models/Branch");
const InsertHunk = require("../models/InsertHunk");

const IntegrationBoard = require("../models/integrations/integration_objects/IntegrationBoard");
const Association = require("../models/associations/Association");

const IntegrationTicket = require("../models/integrations/integration_objects/IntegrationTicket");

const IntegrationAttachment = require("../models/integrations/integration_objects/IntegrationAttachment");
const IntegrationLabel = require("../models/integrations/integration_objects/IntegrationLabel");
const IntegrationColumn = require("../models/integrations/integration_objects/IntegrationColumn");
const IntegrationComment = require("../models/integrations/integration_objects/IntegrationComment");
const IntegrationInterval = require("../models/integrations/integration_objects/IntegrationInterval");



var mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const Sentry = require("@sentry/node");

const detachWorkspaceFromMembers = async (workspaceId, session) => {

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
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed to remove Workspace from User.workspaces`,
            workspaceId: workspaceId,
            numMembers: usersInWorkspace.length,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed to remove Workspace from User.workspaces`
        );
    }
}


const deleteWorkspaceObject = async (workspaceId, session) => {

    var deletedWorkspace;

    // Delete Workspace
    try {
        deletedWorkspace = await Workspace.findByIdAndRemove(
            workspaceId,
            { session }
        )
            .select("_id repositories boards")
            .lean()
            .exec();
    } catch (err) {

        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed to delete Workspace object`,
            workspaceId: workspaceId,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed to delete Workspace object`
        );
    }

    return deletedWorkspace;

}

const acquireRepositoriesToReset = async (deletedWorkspace, session) => {

    var repositoryWorkspaces;
    var repositoriesToReset = [];

    var workspaceRepositories = deletedWorkspace.repositories;

    var foundRepositories = new Set();

    try {
        // Get all Workspaces of Repositories in deletedWorkspaces
        repositoryWorkspaces = await Workspace.find({repositories: { $in: workspaceRepositories.map(id => ObjectId(id.toString())) }}, '_id repositories', { session })
                                                .lean()
                                                .exec();

        // All Repositories from deletedWorkspace will have to be reset
        if (!repositoryWorkspaces) {
            console.log(`acquireRepositoriesToReset - all repositories in workspace must be reset`);
            repositoryWorkspaces = [];
        }
    }

    catch (err) {
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed find Workspaces related to Deleted Workspace Repositories`,
            workspaceId: deletedWorkspace._id.toString(),
            workspaceRepositories: workspaceRepositories,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed find Workspaces related to Deleted Workspace Repositories`
        );
    }

    console.log(`acquireRepositoriesToReset - all Workspaces with overlapping repositories: ${JSON.stringify(repositoryWorkspaces)}`);


    // Create a Set of all distinct Repositories from fetched Workspaces
    var i = 0;
    var currentWorkspace;
    for (i = 0; i < repositoryWorkspaces.length; i++) {
        currentWorkspace = repositoryWorkspaces[i];
        var k = 0;


        if (!currentWorkspace.repositories) {
            console.log(`acquireRepositoriesToReset - no repositories for overlapping workspace: ${currentWorkspace._id} - skipping`);
            continue;
        }

        for (k = 0; k < currentWorkspace.repositories.length; k++) {
            foundRepositories.add(currentWorkspace.repositories[k].toString());
        }
    }

    console.log(`acquireRepositoriesToReset - all distinct overlapping Repositories from other workspaces: ${JSON.stringify(Array.from(foundRepositories))}`);

    // Identify which repositories of deletedWorkspace were not found in any other Workspace
    for (i = 0; i < workspaceRepositories.length; i++) {
        if (!foundRepositories.has(workspaceRepositories[i].toString())) {
            repositoriesToReset.push(workspaceRepositories[i]);
        }
    }

    return repositoriesToReset;

}

const deleteCommits = async (repositoriesToReset, session) => {

    if (repositoriesToReset.length < 1) {
        return;
    }

    // Delete Repository Commits
    try {
        await Commit.deleteMany( { repository: { $in: repositoriesToReset.map(id => ObjectId(id.toString())) } }, { session })
                    .exec();
    }
    catch (err) {
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed to delete Commits`,
            repositoriesToReset: repositoriesToReset,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed to delete Commits`
        );
    }
}

const deletePullRequests = async (repositoriesToReset, session) => {

    if (repositoriesToReset.length < 1) {
        return;
    }

    // Delete Repository Commits
    try {
        await PullRequest.deleteMany( { repository: { $in: repositoriesToReset.map(id => ObjectId(id.toString())) } }, { session })
        .exec();
    }
    catch (err) {
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed to delete PullRequests`,
            repositoriesToReset: repositoriesToReset,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed to delete PullRequests`
        );
    }
}

const deleteBranches = async (repositoriesToReset, session) => {
    if (repositoriesToReset.length < 1) {
        return;
    }

    // Delete Repository Commits
    try {
        await Branch.deleteMany( { repository: { $in: repositoriesToReset.map(id => ObjectId(id.toString())) } }, { session })
        .exec();
    }
    catch (err) {
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed to delete Branches`,
            repositoriesToReset: repositoriesToReset,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed to delete Branches`
        );
    }
}

const deleteInsertHunks = async (repositoriesToReset, session) => {
    if (repositoriesToReset.length < 1) {
        return;
    }

    // Delete Repository InsertHunks
    try {
        await InsertHunk.deleteMany( { repository: { $in: repositoriesToReset.map(id => ObjectId(id.toString())) } }, { session } )
                        .exec();
    }
    catch (err) {
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed to delete InsertHunks`,
            repositoriesToReset: repositoriesToReset,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed to delete InsertHunks`
        );
    }
}

const resetRepositories = async (repositoriesToReset, session) => {

    try {
        // Reset Repositories 
        await Repository.updateMany( { _id: { $in: repositoriesToReset } },
                                     { $set: { scanned: false, currentlyScanning: false } },
                                     { session })
                         .exec();
    }
    catch (err) {
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed to reset Repositories`,
            repositoriesToReset: repositoriesToReset,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed to reset Repositories`
        );
    }

}

const acquireBoardsToDelete = async (deletedWorkspace, session) => {

    var boardWorkspaces;
    var boardsToDelete = [];

    var workspaceBoards = deletedWorkspace.boards;

    var foundBoards = new Set();

    try {
        // Get all Workspaces of Boards in deletedWorkspaces
        boardWorkspaces = await Workspace.find({boards: { $in: workspaceBoards.map(id => ObjectId(id.toString())) }}, '_id boards', { session })
                                                .lean()
                                                .exec();

        // No Boards in Workspace present in any other Workspace
        // All Boards from deletedWorkspace will have to be reset
        if (!boardWorkspaces) {
            console.log(`acquireBoardsToDelete - all boards in workspace must be reset`);
            boardWorkspaces = [];
        }
    }

    catch (err) {
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed find Workspaces related to Deleted Workspace Boards`,
            workspaceBoards: workspaceBoards,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed find Workspaces related to Deleted Workspace Boards`
        );
    }

    console.log(`acquireBoardsToDelete - all Workspaces with overlapping boards: ${JSON.stringify(boardWorkspaces)}`);

    // Create a Set of all distinct Boards from fetched Workspaces
    var i = 0;
    var currentWorkspace;
    for (i = 0; i < boardWorkspaces.length; i++) {
        currentWorkspace = boardWorkspaces[i];
        var k = 0;

        if (!currentWorkspace.boards) {
            continue;
        }

        console.log(`acquireBoardsToDelete - currentWorkspace: ${JSON.stringify(currentWorkspace)}`);

        for (k = 0; k < currentWorkspace.boards.length; k++) {
            // console.log(`acquireBoardsToDelete - adding ${currentWorkspace.boards[k].toString()} to foundBoards`);
            foundBoards.add(currentWorkspace.boards[k].toString());
        }
    }

    console.log(`acquireBoardsToDelete - all distinct overlapping Boards from other workspaces: ${JSON.stringify(Array.from(foundBoards))}`);


    // Identify which boards of deletedWorkspace were not found in any other Workspace
    for (i = 0; i < workspaceBoards.length; i++) {
        if (!foundBoards.has(workspaceBoards[i].toString())) {
            boardsToDelete.push(workspaceBoards[i]);
        }
    }


    return boardsToDelete;
}

const deleteIntegrationBoards = async (boardsToDelete, session) => {

    console.log(`deleteIntegrationBoards received boardsToDelete: ${JSON.stringify(boardsToDelete)}`);

    if (boardsToDelete.length < 1) {
        return;
    }

    var boardIds = boardsToDelete.map( boardObj => ObjectId(boardObj._id.toString()));

    try {
        await IntegrationBoard.deleteMany( { _id: { $in: boardIds } },
                                            { session })
                                        .exec();
    }
    catch (err) {
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed to delete IntegrationBoards`,
            boardIds: boardIds,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed to delete IntegrationBoards`
        );
    }

}

const deleteAssociations = async (boardsToDelete, session) => {
    if (boardsToDelete.length < 1) {
        return;
    }

    var boardIds = boardsToDelete.map( boardObj => ObjectId(boardObj._id.toString()));

    try {
        await Association.deleteMany({ board: { $in: boardIds } },
                                     { session })
                         .exec();
    }
    catch (err) {
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed to delete Associations`,
            boardIds: boardIds,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed to delete Associations`
        );
    }
}

const detachWorkspaceFromAssociations = async (workspaceId, session) => {

    try {
        await Association.updateMany(
            { workspaces: { $in: [ObjectId(workspaceId.toString())] } },
            { $pull: { workspaces: { $in: [ObjectId(workspaceId.toString())] } } },
            { session }
        ).exec();
    }
    catch (err) {
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed to remove Workspace from Association.workspaces`,
            workspaceId: workspaceId,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed to remove Workspace from Association.workspaces`
        );
    }
};


const acquireIntegrationTicketsToDelete = async (boardsToDelete, session) => {

    var ticketsToDelete;

    try {
        ticketsToDelete = await IntegrationTicket.find({board: { $in: boardsToDelete.map(id => ObjectId(id.toString())) }},
                                    'creator assignees members labels column comments attachments intervals',
                                    { session })
                                    .lean()
                                    .exec();
        if (!ticketsToDelete) {
            return [];
        }
    }
    catch (err) {
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed find IntegrationTickets related to Deleted Workspace Boards`,
            boardsToDelete: boardsToDelete,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed find IntegrationTickets related to Deleted Workspace Boards`
        );
    }

    return ticketsToDelete;

}

const deleteIntegrationTickets = async (ticketsToDelete, session) => {

    if (ticketsToDelete.length < 1) {
        return;
    }

    var ticketIds = ticketsToDelete.map( ticketObj => ObjectId(ticketObj._id.toString()));

    try {
        await IntegrationTicket.deleteMany( { _id: { $in: ticketIds } },
                                            { session })
                                        .exec();
    }
    catch (err) {
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed to delete IntegrationTickets`,
            ticketIds: ticketIds,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed to delete IntegrationTickets`
        );
    }
}

const deleteIntegrationAttachments = async (ticketsToDelete, session) => {
    if (ticketsToDelete.length < 1) {
        return;
    }

    var attachmentsToDelete = ticketsToDelete.map( ticketObj => ticketObj.attachments).filter(attachmentList => (attachmentList));
    
    attachmentsToDelete = attachmentsToDelete.flat().map(attachmentId => ObjectId(attachmentId.toString()));

    attachmentsToDelete = [...new Set(attachmentsToDelete)];

    if (attachmentsToDelete.length < 1) {
        return;
    }

    try {
        await IntegrationAttachment.deleteMany({ _id: { $in: attachmentsToDelete } }, { session })
                                    .exec();
    }
    catch (err) {
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed to delete IntegrationAttachments`,
            numAttachments: attachmentsToDelete.length,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed to delete IntegrationAttachments`
        );
    }

}


const deleteIntegrationLabels = async (ticketsToDelete, session) => {
    if (ticketsToDelete.length < 1) {
        return;
    }


    var labelsToDelete = ticketsToDelete.map( ticketObj => ticketObj.labels).filter(labelList => (labelList));
    
    labelsToDelete = labelsToDelete.flat().map(labelId => ObjectId(labelId.toString()));

    labelsToDelete = [...new Set(labelsToDelete)];

    if (labelsToDelete.length < 1) {
        return;
    }


    try {
        await IntegrationLabel.deleteMany({ _id: { $in: labelsToDelete } }, { session })
                                    .exec();
    }
    catch (err) {
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed to delete IntegrationLabels`,
            numLabels: labelsToDelete.length,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed to delete IntegrationLabels`
        );
    }

}

const deleteIntegrationColumns = async (ticketsToDelete, session) => {
    if (ticketsToDelete.length < 1) {
        return;
    }
    

    var columnsToDelete = ticketsToDelete.map( ticketObj => ticketObj.columns).filter(columnList => (columnList));
    
    columnsToDelete = columnsToDelete.flat().map(columnId => ObjectId(columnId.toString()));

    columnsToDelete = [...new Set(columnsToDelete)];

    if (columnsToDelete.length < 1) {
        return;
    }

    try {
        await IntegrationColumn.deleteMany({ _id: { $in: columnsToDelete } }, { session })
                                    .exec();
    }
    catch (err) {
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed to delete IntegrationColumns`,
            numColumns: columnsToDelete.length,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed to delete IntegrationColumns`
        );
    }

}

const deleteIntegrationComments = async (ticketsToDelete, session) => {
    if (ticketsToDelete.length < 1) {
        return;
    }


    var commentsToDelete = ticketsToDelete.map( ticketObj => ticketObj.comments).filter(commentList => (commentList));
    
    commentsToDelete = commentsToDelete.flat().map(commentId => ObjectId(commentId.toString()));

    commentsToDelete = [...new Set(commentsToDelete)];

    if (commentsToDelete.length < 1) {
        return;
    }


    try {
        await IntegrationComment.deleteMany({ _id: { $in: commentsToDelete } }, { session })
                                    .exec();
    }
    catch (err) {
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed to delete IntegrationComments`,
            numComments: commentsToDelete.length,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed to delete IntegrationComments`
        );
    }

}


const deleteIntegrationIntervals = async (ticketsToDelete, session) => {
    if (ticketsToDelete.length < 1) {
        return;
    }

    var intervalsToDelete = ticketsToDelete.map( ticketObj => ticketObj.intervals).filter(intervalList => (intervalList));
    
    intervalsToDelete = intervalsToDelete.flat().map(intervalId => ObjectId(intervalId.toString()));

    intervalsToDelete = [...new Set(intervalsToDelete)];

    if (intervalsToDelete.length < 1) {
        return;
    }


    try {
        await IntegrationInterval.deleteMany({ _id: { $in: intervalsToDelete } }, { session })
                                    .exec();
    }
    catch (err) {
        console.log(err);

        Sentry.setContext("Delete Workspace", {
            message: `Failed to delete IntegrationIntervals`,
            numIntervals: intervalsToDelete.length,
        });

        Sentry.captureException(err);

        throw new Error(
            `Failed to delete IntegrationIntervals`
        );
    }

}



module.exports = {
    detachWorkspaceFromMembers,
    deleteWorkspaceObject,

    acquireRepositoriesToReset,
    deleteCommits,
    deletePullRequests,
    deleteBranches,

    deleteInsertHunks,

    resetRepositories,

    acquireBoardsToDelete,
    deleteIntegrationBoards,

    deleteAssociations,
    detachWorkspaceFromAssociations,

    acquireIntegrationTicketsToDelete,
    deleteIntegrationTickets,

    deleteIntegrationAttachments,
    deleteIntegrationLabels,
    deleteIntegrationColumns,
    deleteIntegrationComments,
    deleteIntegrationIntervals,

}