const Workspace = require('../models/Workspace');


var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const referenceMiddleware = (req, res, next) => {
    console.log('req.path.trim(): ', req.path.trim());
    var requestedPath = req.path.trim();

    var requesterId = req.tokenPayload.userId.toString();
    var requesterRole = req.tokenPayload.role;

    const { workspaceId } = req.params;

    var searchUserId;

    switch (requestedPath) {
        case requestedPath.includes('/references/create'):
            if (requesterRole == 'dev') {
                next();
            }
            else {
                next(new Error("Error: only dev tokens can create references"));
            }

        default:
            try {
                searchUserId = ObjectId(workspaceId);
            }
            catch (err) {
                return next(new Error("Error: invalid workspaceId format"));
            }
            var foundWorkspace = await Workspace.findById(searchUserId);
            if (!foundWorkspace) {
                return next(new Error("Error: workspaceId invalid"));
            }
            req.workspaceObj = foundWorkspace;

            if (requesterRole == 'dev') {
                console.log('referenceMiddleware dev token');
                next();
            }

            var validUsers = foundWorkspace.memberUsers.map(userId => userId.toString());
            if (validUsers.indexOf(requesterId) > -1) {
                console.log('Valid reference request');
                next();
            }
            else {
                return next(new Error("Error: requesting user not a member of target workspace"));
            }

    }
}

const documentMiddleware = async (req, res, next) => {
    console.log('req.path.trim(): ', req.path.trim());
    const { workspaceId } = req.params;
    var searchUserId;
    try {
        searchUserId = ObjectId(workspaceId);
    }
    catch (err) {
        return next(new Error("Error: invalid workspaceId format"));
    }
    var foundWorkspace = await Workspace.findById(searchUserId);
    if (!foundWorkspace) {
        return next(new Error("Error: workspaceId invalid"));
    }

    req.workspaceObj = foundWorkspace;

    if (req.tokenPayload.role == 'dev') {
        console.log('documentMiddleware dev token');
        next();
    }
    var requesterId = req.tokenPayload.userId.toString();
    var validUsers = foundWorkspace.memberUsers.map(userId => userId.toString());
    if (validUsers.indexOf(requesterId) > -1) {
        console.log('Valid document request');
        next();
    }
    else {
        return next(new Error("Error: requesting user not a member of target workspace"));
    }
}

const snippetMiddleware = (req, res, next) => {
    console.log('req.path.trim(): ', req.path.trim());
    const { workspaceId } = req.params;
    var searchUserId;
    try {
        searchUserId = ObjectId(workspaceId);
    }
    catch (err) {
        return next(new Error("Error: invalid workspaceId format"));
    }
    var foundWorkspace = await Workspace.findById(searchUserId);
    if (!foundWorkspace) {
        return next(new Error("Error: workspaceId invalid"));
    }

    req.workspaceObj = foundWorkspace;

    if (req.tokenPayload.role == 'dev') {
        console.log('snippetMiddleware dev token');
        next();
    }
    var requesterId = req.tokenPayload.userId.toString();
    var validUsers = foundWorkspace.memberUsers.map(userId => userId.toString());
    if (validUsers.indexOf(requesterId) > -1) {
        console.log('Valid snippet request');
        next();
    }
    else {
        return next(new Error("Error: requesting user not a member of target workspace"));
    }
}

const repositoryMiddleware = (req, res, next) => {

}

const workspaceMiddleware = (req, res, next) => {

}

const tagMiddleware = (req, res, next) => {

}

const authMiddleware = (req, res, next) => {

}

const userMiddleware = (req, res, next) => {

}

const tokenMiddleware = (req, res, next) => {

}

module.exports = {
    referenceMiddleware,
    documentMiddleware,
    snippetMiddleware,
    repositoryMiddleware,
    workspaceMiddleware,
    tagMiddleware,
    authMiddleware,
    userMiddleware,
    tokenMiddleware
}