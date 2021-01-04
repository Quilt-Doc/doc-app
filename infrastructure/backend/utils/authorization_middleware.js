const Workspace = require('../models/Workspace');
const Repository = require('../models/Repository');
const Reference = require('../models/Reference');
const Tag = require('../models/Tag');
const User = require('../models/authentication/User');

var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const referenceMiddleware = async (req, res, next) => {
    var requestedPath = req.path.trim();

    var requesterId = req.tokenPayload.userId.toString();
    var requesterRole = req.tokenPayload.role;

    const { workspaceId, referenceId, tagId } = req.params;

    var searchWorkspaceId;
    var searchReferenceId;
    var searchTagId;




    if (requestedPath.includes('/references/create')) {
        if (requesterRole == 'dev') {
            return next();
        }
        else {
            return next(new Error("Error: only dev tokens can create references"));
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
            return next();
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

            return next();
        }
        else {
            return next(new Error("Error: requesting user not a member of target workspace"));
        }
    }

}

// TODO: Fix this
const documentMiddleware = async (req, res, next) => {
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
        return next();
    }
    var requesterId = req.tokenPayload.userId.toString();
    var validUsers = foundWorkspace.memberUsers.map(userId => userId.toString());
    if (validUsers.indexOf(requesterId) > -1) {
        return next();
    }
    else {
        return next(new Error("Error: requesting user not a member of target workspace"));
    }
}

const snippetMiddleware = async (req, res, next) => {
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
        return next();
    }
    var requesterId = req.tokenPayload.userId.toString();
    var validUsers = foundWorkspace.memberUsers.map(userId => userId.toString());
    if (validUsers.indexOf(requesterId) > -1) {
        return next();
    }
    else {
        return next(new Error("Error: requesting user not a member of target workspace"));
    }
}

const repositoryMiddleware = async (req, res, next) => {
    var requestedPath = req.path.trim();

    var requesterId = req.tokenPayload.userId.toString();
    var requesterRole = req.tokenPayload.role;

    const { workspaceId, repositoryId } = req.params;

    var searchWorkspaceId;
    var searchRepositoryId = undefined;

    // Dev routes
    if (
        requestedPath.includes('/repositories/init') ||
        requestedPath.includes('/repositories/update') ||
        requestedPath.includes('/repositories/job_retrieve') ||
        requestedPath.includes('/repositories/remove_installation') ||
        requestedPath.includes('/repositories/test/retrieve')
        ) {
        
        if (requesterRole == 'dev') {
            return next();
        }
        else {
            return next(new Error("Error: only dev tokens can access this repository route."));
        }
    }

    // User routes

    // poll and validate are temporarily enabled for everything
    if (requestedPath.includes('/repositories/retrieve') || requestedPath.includes('retrieve_creation')) {
        if (requesterRole == 'dev') {
            return next();
        }
        // TODO: Fix temporarily allowing everyone to call this.
        else {
            return next();
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
            return next();
        }

        var validUsers = foundWorkspace.memberUsers.map(userId => userId.toString());
        if (validUsers.indexOf(requesterId) > -1) {
            return next();
        }
        else {
            return next(new Error("Error: requesting user not a member of target workspace"));
        }
    }
}

const workspaceMiddleware = async (req, res, next) => {
    var requestedPath = req.path.trim();

    var requesterId = req.tokenPayload.userId.toString();
    var requesterRole = req.tokenPayload.role;

    const { workspaceId } = req.params;

    var searchWorkspaceId;


    // Temporarily allow any user to access the create method
    if (requestedPath.includes('/workspaces/create')) {
        return next();
    }

    if (requestedPath.includes('/workspaces/retrieve')) {
        return next();
    }

    else {
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

        if (requesterRole == 'dev') {
            return next();
        }

        var validUsers = foundWorkspace.memberUsers.map(userId => userId.toString());
        if (validUsers.indexOf(requesterId) > -1) {

            // Only the creator can delete a Workspace
            if (requestedPath.includes('/workspaces/delete')) {
                if (foundWorkspace.creator.toString() == requesterId.toString()) {
                    return next();
                }
                else {
                    return next(new Error("Error: only the creator of a workspace can delete it"));
                }
            }

            return next();
        }
        else {
            return next(new Error("Error: requesting user not a member of target workspace"));
        }
    }
}

const tagMiddleware = async (req, res, next) => {
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
        return next();
    }

    var validUsers = foundWorkspace.memberUsers.map(userId => userId.toString());
    if (validUsers.indexOf(requesterId) > -1) {
        return next();
    }
    else {
        return next(new Error("Error: requesting user not a member of target workspace"));
    }
}

const authMiddleware = async (req, res, next) => {
    next();
}

const userMiddleware = async (req, res, next) => {
    var requestedPath = req.path.trim();

    var requesterId = req.tokenPayload.userId.toString();
    var requesterRole = req.tokenPayload.role;

    const { workspaceId, userId } = req.params;

    var searchWorkspaceId = undefined;
    var searchUserId = undefined;


    // Verify membership in workspace for calling user, if :tagId then verify tag is in workspace
    // Default case
    try {
        if (workspaceId) {
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
        foundUser = await User.findById(searchUserId);
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
            return next();
        }
        else {
            return next(new Error("Error: userId doesn't match JWT"));
        }
    }


    // Verify user is in workspace
    if (foundWorkspace) {
        if (requesterRole == 'dev') {
            return next();
        }

        var validUsers = foundWorkspace.memberUsers.map(userId => userId.toString());
        if (validUsers.indexOf(requesterId) > -1) {
            return next();
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
        return next();
    }
    else {
        return next(new Error("Error: only dev tokens can access the token API"));
    }
}


const checkMiddleware = async (req, res, next) => {
    var requesterId = req.tokenPayload.userId.toString();
    var requesterRole = req.tokenPayload.role;

    const { workspaceId, repositoryId } = req.params;    

    if (requesterRole == 'dev') {
        return next();
    }

    var searchWorkspaceId = undefined;
    var searchRepositoryId = undefined;

    try {
        if (workspaceId) {
            searchWorkspaceId = ObjectId(workspaceId);
        }
        if (repositoryId) {
            searchRepositoryId = ObjectId(repositoryId);
        }
    }
    catch (err) {
        return next(new Error("Error: invalid workspaceId or repositoryId format"));
    }

    var foundWorkspace = undefined;
    if (searchWorkspaceId){
        foundWorkspace = await Workspace.findById(searchWorkspaceId).lean().exec();

        // Verify Repository is accessible from Workspace
        if (searchRepositoryId) {
            var validRepositories = foundWorkspace.repositories.map(id => id.toString());
            if (validRepositories.includes(searchRepositoryId.toString()) == -1) {
                return next(new Error("Error: repositoryId not accessible from workspace"));
            }
        }

        // Verify User can access Workspace
        var validUsers = foundWorkspace.memberUsers.map(userId => userId.toString());
        if (validUsers.indexOf(requesterId) > -1) {
            return next();
        }
        else {
            return next(new Error("Error: requesting user not a member of target workspace"));
        }
    }
}


const reportingMiddleware = async (req, res, next) => {
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
        next();
    }
    var requesterId = req.tokenPayload.userId.toString();
    var validUsers = foundWorkspace.memberUsers.map(userId => userId.toString());
    if (validUsers.indexOf(requesterId) > -1) {
        next();
    }
    else {
        return next(new Error("Error: requesting user not a member of target workspace"));
    }   
}

const notificationMiddleware = async (req, res, next) => {

    var requesterId = req.tokenPayload.userId.toString();
    var requesterRole = req.tokenPayload.role;

    const { userId } = req.params;

    var searchUserId;
    try {
        if (userId) {
            searchUserId = ObjectId(userId);
        }
    }
    catch (err) {
        return next(new Error("Error: invalid userId format"));
    }

    var foundUser = undefined;
    if (searchUserId) {
        try {
            foundUser = await User.findById(searchUserId).lean().exec();
        }
        catch (err) {
            return next(new Error("Error: could not find userId"));
        }

        req.userObj = foundUser;
        
        if (requesterRole == 'dev') {
            return next();
        }
        else if ( requesterId == foundUser._id.toString()) {
            return next();
        }
        else {
            return next(new Error("Error: Cannot request another User's notifications"));
        }
    }
    // Temporarily return next() always if no userId param, since all routes have userId param anyway
    else {
        return next();
    }
};

const branchMiddleware = async (req, res, next) => {

    var requesterId = req.tokenPayload.userId.toString();
    var requesterRole = req.tokenPayload.role;

    if (requesterRole == 'dev') {
        return next();
    }
    else {
        return next(new Error("Error: only dev tokens can access the branch API"));
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
    tokenMiddleware,
    reportingMiddleware,
    checkMiddleware,
    notificationMiddleware,
    branchMiddleware,
}