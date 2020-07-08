
const Workspace = require('../models/Workspace');
var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

createWorkspace = (req, res) => {
    const {name, creatorID, debugID, repositoryIDs, icon, key} = req.body;

    if (!typeof name == 'undefined' && name !== null) return res.json({success: false, error: 'no workspace name provided'});
    if (!typeof creatorID == 'undefined' && creatorID !== null) return res.json({success: false, error: 'no workspace creator ID provided'});

    let workspace = new Workspace({
        name: name,
        creator: ObjectId(creatorID),
        memberUsers: [ObjectId(creatorID)],
        key
    });

    if (icon >= 0) workspace.icon = icon;
    if (repositoryIDs) workspace.repositories = repositoryIDs.map(id => ObjectId(id))
    
    // Check if user-defined ids allowed
    if (process.env.DEBUG_CUSTOM_ID && process.env.DEBUG_CUSTOM_ID != 0) {
        if (debugID) workspace._id = ObjectId(debugID);
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
    const { userID } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no workspace id provided'});
    if (!typeof userID == 'undefined' && userID !== null) return res.json({success: false, error: 'no user id provided'});

    let update = {};
    if (userID) update.memberUsers = ObjectId(userID);

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
    const { userID } = req.body;
    
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no workspace id provided'});
    if (!typeof userID == 'undefined' && userID !== null) return res.json({success: false, error: 'no user id provided'});

    let update = {};
    if (userID) update.memberUsers = ObjectId(userID);

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
    
    const {name, creatorID, memberUserIDs} = req.body;
    query = Workspace.find();
    if (name) query.where('name').equals(name);
    if (creatorID) query.where('creator').equals(creatorID);
    if (memberUserIDs) query.where('memberUsers').in(memberUserIDs)

    query.populate('repositories').populate('creator').populate('memberUsers').exec((err, workspaces) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(workspaces);
    });
}

module.exports = {createWorkspace, getWorkspace, deleteWorkspace, addUser, removeUser, retrieveWorkspaces}
