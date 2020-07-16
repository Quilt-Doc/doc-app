
const Workspace = require('../models/Workspace');
var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

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

        workspace.populate('repositories').populate('creator').populate('memberUsers', (err, workspace) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(workspace);
        });
    });
}

getWorkspace = (req, res) => {
    console.log(req.params.id);
    id = req.params.id;
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no workspace id provided'});
    Workspace.findById(id, (err, workspace) => {
		if (err) return res.json({success: false, error: err});
        workspace.populate('creator')
                .populate('memberUsers', (err, workspace) => {
                if (err) return res.json({ success: false, error: err });
                return res.json(workspace);
            });
    });
}

deleteWorkspace = (req, res) => {
    const { id } = req.params; 
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no workspace id provided'});

    Workspace.findByIdAndRemove(id, (err, workspace) => {
		if (err) return res.json({success: false, error: err});
        workspace.populate('creator')
            .populate('memberUsers', (err, workspace) => {
            if (err) return res.json({ success: false, error: err });
                return res.json(workspace);
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
        workspace.populate('creator')
                .populate('memberUsers', (err, workspace) => {
                if (err) return res.json({ success: false, error: err });
                return res.json(workspace);
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
        workspace.populate('creator')
                .populate('memberUsers', (err, workspace) => {
                if (err) return res.json({ success: false, error: err });
                return res.json(workspace);
            });
    });
}

retrieveWorkspaces = (req, res) => {
    
    const {name, creatorId, memberUserIds} = req.body;
    query = Workspace.find();
    if (name) query.where('name').equals(name);
    if (creatorId) query.where('creator').equals(creatorId);
    if (memberUserIds) query.where('memberUsers').in(memberUserIds)

    query.populate('repositories').populate('creator').populate('memberUsers').exec((err, workspaces) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(workspaces);
    });
}

module.exports = {createWorkspace, getWorkspace, deleteWorkspace, addUser, removeUser, retrieveWorkspaces}
