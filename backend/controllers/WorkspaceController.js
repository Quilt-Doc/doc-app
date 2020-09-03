
const Workspace = require('../models/Workspace');
const Reference = require('../models/Reference');
const Document = require('../models/Document');
const Tag = require('../models/Tag');


var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const PAGE_SIZE = 10;

checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true
    }
    return false
}

escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}


createWorkspace = (req, res) => {
    const {name, creatorId, debugId, repositoryIds, icon, key} = req.body;

    if (!typeof name == 'undefined' && name !== null) return res.json({success: false, error: 'no workspace name provided'});
    if (!typeof creatorId == 'undefined' && creatorId !== null) return res.json({success: false, error: 'no workspace creator Id provided'});

    let workspace = new Workspace({
        name: name,
        creator: ObjectId(creatorId),
        memberUsers: [ObjectId(creatorId)],
        key
    });

    if (icon >= 0) workspace.icon = icon;
    if (repositoryIds) workspace.repositories = repositoryIds.map(id => ObjectId(id))
    
    // Check if user-defined ids allowed
    if (process.env.DEBUG_CUSTOM_Id && process.env.DEBUG_CUSTOM_Id != 0) {
        if (debugId) workspace._id = ObjectId(debugId);
    }

    workspace.save((err, workspace) => {
        if (err) return res.json({ success: false, error: err });

        workspace.populate('creator').populate('repositories').populate('memberUsers', (err, workspace) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: workspace});
        });
    });
}

getWorkspace = (req, res) => {
    console.log(req.params.id);
    id = req.params.id;
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no workspace id provided'});
    Workspace.findById(id, (err, workspace) => {
		if (err) return res.json({success: false, error: err});
        workspace.populate('creator').populate('repositories')
                .populate('memberUsers', (err, workspace) => {
                if (err) return res.json({ success: false, error: err });
                return res.json({success: true, result: workspace});
            });
    });
}

searchWorkspace = async (req, res) => {
    const { workspaceId, userQuery, repositoryId, tagIds,
            returnReferences, returnDocuments, requestedPageSize, requestedPageNumber} = req.body;

    // for the `returnReferences`, `returnDocuments` params, put a string "true" if you want to do it
    if (!checkValid(workspaceId)) return res.json({success: false, result: null, error: 'searchWorkspace: error no workspaceId provided.'});
    if (!checkValid(userQuery)) return res.json({success: false, result: null, error: 'searchWorkspace: error no userQuery provided.'});
    if (!checkValid(returnReferences)) return res.json({success: false, result: null, error: 'searchWorkspace: error no returnReferences provided.'});
    if (!checkValid(returnDocuments)) return res.json({success: false, result: null, error: 'searchWorkspace: error no returnDocuments provided.'});

    var searchResults = [];

    var pageSize = checkValid(requestedPageSize) ? parseInt(requestedPageSize) : PAGE_SIZE;
    var pageNumber = checkValid(requestedPageNumber) ? parseInt(requestedPageNumber) : 0;


    var re = new RegExp(escapeRegExp(userQuery), 'i');

    var documentFilter;
    if (tagIds) {
        documentFilter = {title: {$regex: re}, workspace: workspaceId, tags: {$in: tagIds.map(tag => ObjectId(tag))}};
    }
    else {
        documentFilter = {title: {$regex: re}, workspace: workspaceId};
    }
    var referenceFilter;

    if (!repositoryId) {
        var searchableRepositories = await Workspace.findById(workspaceId);
        searchableRepositories = searchableRepositories.repositories.map(repositoryObj => repositoryObj._id.toString());

        referenceFilter = {
            repository: { $in:  searchableRepositories.map(obj => ObjectId(obj))},
            name: { $regex: re}
        };
    }

    else {
        referenceFilter = {
            repository: ObjectId(repositoryId),
            name: { $regex: re}
        };
    }

    var temp;
    if (returnReferences == 'true') {
        temp = await Reference.find(referenceFilter).skip(pageNumber*pageSize).limit(pageSize).exec();
        searchResults.push(...temp);
    }
    if (returnDocuments == 'true') {
        temp = await Document.find(documentFilter).skip(pageNumber*pageSize).limit(pageSize).exec();
        searchResults.push(...temp);
    }

    return res.json({success: true, result: searchResults});
}

deleteWorkspace = (req, res) => {
    const { id } = req.params; 
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no workspace id provided'});

    Workspace.findByIdAndRemove(id, (err, workspace) => {
		if (err) return res.json({success: false, error: err});
        workspace.populate('creator').populate('repositories')
            .populate('memberUsers', (err, workspace) => {
            if (err) return res.json({ success: false, error: err });
                return res.json({success: true, result: workspace});
            });
    });
}


// Put request
// Population only on returns
addUser = (req, res) => {
    id = req.params.id;
    const { userId } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no workspace id provided'});
    if (!typeof userId == 'undefined' && userId !== null) return res.json({success: false, error: 'no user id provided'});

    let update = {};
    if (userId) update.memberUsers = ObjectId(userId);

    Workspace.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, workspace) => {
        if (err) return res.json({ success: false, error: err });
        workspace.populate('creator').populate('repositories')
                .populate('memberUsers', (err, workspace) => {
                if (err) return res.json({ success: false, error: err });
                return res.json({success: true, result: workspace});
        });
    });
}

removeUser = (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no workspace id provided'});
    if (!typeof userId == 'undefined' && userId !== null) return res.json({success: false, error: 'no user id provided'});

    let update = {};
    if (userId) update.memberUsers = ObjectId(userId);

    Workspace.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, workspace) => {
        if (err) return res.json({ success: false, error: err });
        workspace.populate('creator').populate('repositories')
                .populate('memberUsers', (err, workspace) => {
                if (err) return res.json({ success: false, error: err });
                return res.json({success: true, result: workspace});
            });
    });
}

// Check that the JWT userId is in the memberUsers for all workspaces returned
retrieveWorkspaces = (req, res) => {
    
    const {name, creatorId, memberUserIds} = req.body;
    query = Workspace.find();
    if (name) query.where('name').equals(name);
    if (creatorId) query.where('creator').equals(creatorId);
    if (memberUserIds) query.where('memberUsers').in(memberUserIds)

    query.populate('creator').populate('memberUsers').populate('repositories').exec((err, workspaces) => {
        if (err) return res.json({ success: false, error: err });
        
        var requesterUserId = req.tokenPayload.userId.toString();
        workspaces = workspaces.filter(currentWorkspace => {
            var currentMemberUsers = currentWorkspace.memberUsers.map(userObj => userObj._id.toString());
            // Only return if requesterUserId is in the memberUsers of the workspace
            return (currentMemberUsers.includes(requesterUserId) != -1);
        });

        return res.json({success: true, result: workspaces});
    });
}

module.exports = {createWorkspace, searchWorkspace, getWorkspace, deleteWorkspace, addUser, removeUser, retrieveWorkspaces}
