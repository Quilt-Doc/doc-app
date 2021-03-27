const Workspace = require('../models/Workspace');
const Repository = require('../models/Repository');

var mongoose = require('mongoose');
const WorkspaceInvite = require('../models/authentication/WorkspaceInvite');
const { ObjectId } = mongoose.Types;

const verifyUserInWorkspace = async (req, res, next) => {

    var requestedPath = req.path.trim();

    var requesterId = req.tokenPayload.userId.toString();
    var requesterRole = req.tokenPayload.role;

    const { workspaceId } = req.params;
    var workspaceFound = false;
    try {
        workspaceFound = await Workspace.exists({    _id: ObjectId(workspaceId.toString()),
                                    members: { $in: [ObjectId(requesterId.toString())] }
                                });
    }
    catch (err) {
        return next(new Error(`Error: invalid workspaceId: ${workspaceId}`));
    }

    if (workspaceFound) {
        return next();
    }
    return next(new Error(`Error: no workspace found for workspaceId: ${workspaceId}`));
};

const verifyUserAndRepositoryInWorkspace = async (req, res, next) => {

    var requestedPath = req.path.trim();

    var requesterId = req.tokenPayload.userId.toString();
    var requesterRole = req.tokenPayload.role;

    const { workspaceId, repositoryId } = req.params;
    var workspaceFound = false;
    try {
        workspaceFound = await Workspace.exists({   _id: ObjectId(workspaceId.toString()),
                                                    members: { $in: [ObjectId(requesterId.toString())] },
                                                    repositories: { $in: [ObjectId(repositoryId.toString())] },
                                                });
    }
    catch (err) {
        return next(new Error(`Error invalid: workspaceId, repositoryId: ${workspaceId}, ${repositoryId}`));
    }

    if (workspaceFound) {
        return next();
    }
    return next(new Error(`Error: no workspace found for workspaceId, repositoryId: ${workspaceId}, ${repositoryId}`));

}

const verifyUserIdMatchesRequester = async (req, res, next) => {

    var requestedPath = req.path.trim();

    var requesterId = req.tokenPayload.userId.toString();
    var requesterRole = req.tokenPayload.role;

    const { userId } = req.params;

    if (!userId) {
        return next(new Error(`No userId provided`));
    }
    if (userId == requesterId) {
        return next();
    }

    return next(new Error(`UserId doesn't match requested Id`));

}

module.exports = {
    verifyUserInWorkspace,
    verifyUserAndRepositoryInWorkspace,
    verifyUserIdMatchesRequester
}