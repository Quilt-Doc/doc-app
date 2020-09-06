const Workspace = require('../models/Workspace');
const Repository = require('../models/Repository');
const Reference = require('../models/Reference');
const Tag = require('../models/Tag');
const User = require('../models/authentication/User');

var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const referenceMiddleware = async (req, res, next) => {
    console.log('req.path.trim(): ', req.path.trim());
    var requestedPath = req.path.trim();

    var requesterId = req.tokenPayload.userId.toString();
    var requesterRole = req.tokenPayload.role;

    const { workspaceId, referenceId, tagId } = req.params;

    var searchWorkspaceId;
    var searchReferenceId;
    var searchTagId;




    if (requestedPath.includes('/references/create')) {
        if (requesterRole == 'dev') {
            next();
        }
        else {
            next(new Error("Error: only dev tokens can create references"));
        }
    }

    else {
        try {
            if (workspaceId) {
                searchWorkspaceId = ObjectId(workspaceId);
            }
            if (referenceId) {
                searchReferenceId = ObjectId(referenceId);
            }
            if (tagId) {
                searchTagId = ObjectId(tagId);
            }
        }
        catch (err) {
            return next(new Error("Error: invalid workspaceId or referenceId or tagId format"));
        }

        var foundWorkspace = undefined;
        var foundReference = undefined;
        var foundTag = undefined;
        

        if (searchWorkspaceId) {
            foundWorkspace = await Workspace.findById(searchWorkspaceId);
        }
        if (searchReferenceId) {
            foundReference = await Reference.findById(searchReferenceId);
        }
        if (searchTagId) {
            foundTag = await Tag.findById(searchTagId);
        }


        if (!foundWorkspace && searchWorkspaceId) {
            return next(new Error("Error: workspaceId invalid"));
        }

        if (!foundReference && searchReferenceId) {
            return next(new Error("Error: referenceId invalid"));
        }

        if (!foundTag && searchTagId) {
            return next(new Error("Error: tagId invalid"));
        }
        
        if (foundWorkspace) req.workspaceObj = foundWorkspace;
        if (foundReference) req.referenceObj = foundReference;
        if (foundTag) req.tagObj = foundTag;

        if (requesterRole == 'dev') {
            console.log('referenceMiddleware dev token');
            next();
        }

        var validUsers = foundWorkspace.memberUsers.map(userId => userId.toString());
        if (validUsers.indexOf(requesterId) > -1) {
            if (foundReference) {
                var referenceRepository = foundReference.repository.toString();
                var validRepositories = foundWorkspace.repositories.map(id => id.toString());
                if (validRepositories.includes(referenceRepository) == -1) {
                    return next(new Error("Error: referenceId not accessible from workspace"));
                }
            }

            if (foundTag) {
                var tagWorkspace = foundTag.workspace.toString();
                var validWorkspace = foundWorkspace._id.toString();
                if (tagWorkspace != validWorkspace) {
                    return next(new Error("Error: tagId not accessible from workspace"));
                }
            }

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
    var searchWorkspaceId;
    try {
        searchWorkspaceId = ObjectId(workspaceId);
    }
    catch (err) {
        return next(new Error("Error: invalid workspaceId format"));
    }
    var foundWorkspace = await Workspace.findById(searchWorkspaceId);
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

const snippetMiddleware = async (req, res, next) => {
    console.log('req.path.trim(): ', req.path.trim());
    const { workspaceId } = req.params;
    var searchWorkspaceId;
    try {
        searchWorkspaceId = ObjectId(workspaceId);
    }
    catch (err) {
        return next(new Error("Error: invalid workspaceId format"));
    }
    var foundWorkspace = await Workspace.findById(searchWorkspaceId);
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

const repositoryMiddleware = async (req, res, next) => {
    console.log('req.path.trim(): ', req.path.trim());
    var requestedPath = req.path.trim();

    var requesterId = req.tokenPayload.userId.toString();
    var requesterRole = req.tokenPayload.role;

    const { workspaceId, repositoryId } = req.params;

    var searchWorkspaceId;
    var searchRepositoryId = undefined;

    // Dev routes
    if (requestedPath.includes('/repositories/create') ||
        requestedPath.includes('/repositories/update')) {
        
        if (requesterRole == 'dev') {
            next();
        }
        else {
            next(new Error("Error: only dev tokens can access this repository route."));
        }
    }


    // User routes

    // poll and validate are temporarily enabled for everything
    if (requestedPath.includes('/repositories/validate') || (requestedPath.includes('/repositories') && requestedPath.includes('/poll'))) {
        if (requesterRole == 'dev') {
            next();
        }
        // TODO: Fix temporarily allowing everyone to call this.
        else {
            next();
        }
    }

    // Verify membership in workspace for calling user, if :repositoryId then verify repository is in workspace
    else {
        try {
            searchWorkspaceId = ObjectId(workspaceId);
            if (repositoryId) {
                searchRepositoryId = ObjectId(repositoryId);
            }
        }
        catch (err) {
            return next(new Error("Error: invalid workspaceId or repositoryId format"));
        }
        var foundWorkspace = await Workspace.findById(searchWorkspaceId);
        var foundRepository = undefined;

        if (searchRepositoryId) {
            foundRepository = await Repository.findById(searchRepositoryId);
        }

        if (!foundWorkspace) {
            return next(new Error("Error: workspaceId invalid"));
        }

        if (searchRepositoryId && !foundRepository) {
            return next(new Error("Error: repositoryId invalid"));
        }

        req.workspaceObj = foundWorkspace;

        // Check that repository is accessible from workspace
        if (foundRepository) {
            req.repositoryObj = foundRepository;
            var validRepositories = foundWorkspace.repositories.map(id => id.toString());
            
            if (validRepositories.indexOf(searchRepositoryId.toString()) == -1) {
                return next(new Error("Error: repositoryId provided is not in workspace provided"));
            }
        }

        if (requesterRole == 'dev') {
            console.log('referenceMiddleware dev token');
            next();
        }

        var validUsers = foundWorkspace.memberUsers.map(userId => userId.toString());
        if (validUsers.indexOf(requesterId) > -1) {
            console.log('Valid repository request');
            next();
        }
        else {
            return next(new Error("Error: requesting user not a member of target workspace"));
        }
    }
}

const workspaceMiddleware = async (req, res, next) => {
    console.log('req.path.trim(): ', req.path.trim());
    var requestedPath = req.path.trim();

    var requesterId = req.tokenPayload.userId.toString();
    var requesterRole = req.tokenPayload.role;

    const { workspaceId } = req.params;
    console.log('params workspaceId: ', workspaceId);

    var searchWorkspaceId;
    // Retrieve doesn't need middleware auth here
    console.log('TEST: ', requestedPath.includes('/workspaces/retrieve'));


    // Temporarily allow any user to access the create method
    if (requestedPath.includes('/workspaces/create')) {
        next();
    }

    if (requestedPath.includes('/workspaces/retrieve')) {
        console.log('Moving on');
        next();
    }

    else {
        try {
            searchWorkspaceId = ObjectId(workspaceId);
        }
        catch (err) {
            return next(new Error("Error: invalid workspaceId format"));
        }
        console.log('Searching for workspaceId: ', searchWorkspaceId.toString());
        var foundWorkspace = await Workspace.findById(searchWorkspaceId);
        if (!foundWorkspace) {
            return next(new Error("Error: workspaceId invalid"));
        }
        req.workspaceObj = foundWorkspace;

        if (requesterRole == 'dev') {
            console.log('workspaceMiddleware dev token');
            next();
        }

        var validUsers = foundWorkspace.memberUsers.map(userId => userId.toString());
        if (validUsers.indexOf(requesterId) > -1) {
            console.log('Valid workspace request');
            next();
        }
        else {
            return next(new Error("Error: requesting user not a member of target workspace"));
        }
    }

}

const tagMiddleware = async (req, res, next) => {
    console.log('req.path.trim(): ', req.path.trim());
    var requestedPath = req.path.trim();

    var requesterId = req.tokenPayload.userId.toString();
    var requesterRole = req.tokenPayload.role;

    const { workspaceId, tagId } = req.params;

    var searchWorkspaceId;
    var searchTagId = undefined;


    // Verify membership in workspace for calling user, if :tagId then verify tag is in workspace
    // Default case
    try {
        searchWorkspaceId = ObjectId(workspaceId);
        if (tagId) {
            searchTagId = ObjectId(tagId);
        }
    }
    catch (err) {
        return next(new Error("Error: invalid workspaceId or tagId format"));
    }

    var foundWorkspace = await Workspace.findById(searchWorkspaceId);
    
    var foundTag = undefined;
    if (searchTagId) {
        foundTag = await Tag.findById(searchTagId);
    }

    if (!foundWorkspace) {
        return next(new Error("Error: workspaceId invalid"));
    }
    if (searchTagId && !foundTag) {
        return next(new Error("Error: tagId invalid"));
    }

    if (foundTag) {
        req.tagObj = foundTag;
    }
    req.workspaceObj = foundWorkspace;

    // Verify tag is in workspace
    if (foundTag) {
        if (foundTag.workspace.toString() != foundWorkspace._id.toString()) {
            return next(new Error("Error: tagId does not belong to workspaceId"));
        }
    }


    if (requesterRole == 'dev') {
        console.log('tagMiddleware dev token');
        next();
    }

    var validUsers = foundWorkspace.memberUsers.map(userId => userId.toString());
    if (validUsers.indexOf(requesterId) > -1) {
        console.log('Valid tag request');
        next();
    }
    else {
        return next(new Error("Error: requesting user not a member of target workspace"));
    }
}

const authMiddleware = async (req, res, next) => {

}

const userMiddleware = async (req, res, next) => {
    console.log('req.path.trim(): ', req.path.trim());
    var requestedPath = req.path.trim();

    var requesterId = req.tokenPayload.userId.toString();
    var requesterRole = req.tokenPayload.role;

    const { workspaceId, userId } = req.params;

    var searchWorkspaceId = undefined;
    var searchUserId = undefined;


    // Verify membership in workspace for calling user, if :tagId then verify tag is in workspace
    // Default case
    try {
        if (searchWorkspaceId) {
            searchWorkspaceId = ObjectId(workspaceId);
        }
        if (userId) {
            searchUserId = ObjectId(userId);
        }
    }
    catch (err) {
        return next(new Error("Error: invalid workspaceId or userId format"));
    }


    var foundWorkspace = undefined;
    if (searchWorkspaceId){
        foundWorkspace = await Workspace.findById(searchWorkspaceId);
    }
    var foundUser = undefined;
    if (searchUserId) {
        foundUser = await Tag.findById(searchUserId);
    }


    if (searchWorkspaceId && !foundWorkspace) {
        return next(new Error("Error: workspaceId invalid"));
    }
    if (searchUserId && !foundUser) {
        return next(new Error("Error: userId invalid"));
    }


    if (foundWorkspace) {
        req.workspaceObj = foundWorkspace;
    }
    if (foundUser) {
        req.userObj = foundUser;
    }

    if (foundUser) {
        if (requesterId == foundUser._id.toString()) {
            console.log('Valid user request');
            return next();
        }
        else {
            return next(new Error("Error: userId doesn't match JWT"));
        }
    }


    // Verify user is in workspace
    if (foundWorkspace) {
        if (requesterRole == 'dev') {
            console.log('userMiddleware dev token');
            next();
        }

        var validUsers = foundWorkspace.memberUsers.map(userId => userId.toString());
        if (validUsers.indexOf(requesterId) > -1) {
            console.log('Valid user request');
            next();
        }
        else {
            return next(new Error("Error: requesting user not a member of target workspace"));
        }
    }
}

const tokenMiddleware = (req, res, next) => {
    var requesterId = req.tokenPayload.userId.toString();
    var requesterRole = req.tokenPayload.role;

    if (requesterRole == 'dev') {
        next();
    }
    else {
        next(new Error("Error: only dev tokens can access the token API"));
    }
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