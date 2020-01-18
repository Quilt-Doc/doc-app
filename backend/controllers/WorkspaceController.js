const Workspace = require('../models/Workspace');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createWorkspace = (req, res) => {
    // try{req.body = JSON.parse(Object.keys(req.body)[0])}catch(err){req.body = req.body}
    console.log(req.body);
    const {name, creatorId, debugId} = req.body;
    console.log('name: ' + name);
    console.log('creatorId: ' + creatorId);
    if (!typeof name == 'undefined' && name !== null) return res.json({success: false, error: 'no workspace name provided'});
    if (!typeof creatorId == 'undefined' && creatorId !== null) return res.json({success: false, error: 'no workspace creator ID provided'});

    let workspace = new Workspace({
        name: name,
        creator: ObjectId(creatorId),
        memberUsers: [ObjectId(creatorId)]
    });

    // Check if user-defined ids allowed
    if (process.env.DEBUG_CUSTOM_ID && process.env.DEBUG_CUSTOM_ID != 0) {
        if (debugId) workspace._id = ObjectId(debugId);
    }

    workspace.save((err, workspace) => {
        if (err) return res.json({ success: false, error: err });
        workspace.save((err, workspace) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(workspace);
        });
        /*workspace.populate('projects')
        .populate('memberUsers', (err, workspace) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(workspace);
        });*/
    });
}

getWorkspace = (req, res) => {
    console.log(req.params.id);
    id = req.params.id;
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no workspace id provided'});
    Workspace.findById(id, (err, workspace) => {
		if (err) return res.json({success: false, error: err});
		return res.json(workspace);
    });
        /*workspace.populate('projects')
        .populate('memberUsers', (err, workspace) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(workspace);
        });*/
}

// Put request
// Population only on returns
addProject = (req, res) => {
    id = req.params.id;
    const { projectId } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no workspace id provided'});
    if (!typeof projectId == 'undefined' && projectId !== null) return res.json({success: false, error: 'no project id provided'});

    let update = {};
    if (projectId) update.projects = ObjectId(projectId);

    Workspace.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, workspace) => {
        if (err) return res.json({ success: false, error: err });
		return res.json(workspace);
        /*workspace.populate('projects')
        .populate('memberUsers', (err, workspace) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(workspace);
        });*/
    });
}

removeProject = (req, res) => {
    const { id } = req.params;
    const { projectId } = req.body;
    
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no workspace id provided'});
    if (!typeof projectId == 'undefined' && projectId !== null) return res.json({success: false, error: 'no project id provided'});

    let update = {};
    if (projectId) update.projects = ObjectId(projectId);

    Workspace.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, workspace) => {
        if (err) return res.json({ success: false, error: err });
		return res.json(workspace);
        /*workspace.populate('projects')
        .populate('memberUsers', (err, workspace) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(workspace);
        });*/
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
		return res.json(workspace);
        /*workspace.populate('projects')
        .populate('memberUsers', (err, workspace) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(workspace);
        });*/
    });
}

removeUser = (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no workspace id provided'});
    if (!typeof userId == 'undefined' && projectId !== null) return res.json({success: false, error: 'no user id provided'});

    let update = {};
    if (userId) update.memberUsers = ObjectId(userId);

    Workspace.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, workspace) => {
        if (err) return res.json({ success: false, error: err });
		return res.json(workspace);
        /*workspace.populate('projects')
        .populate('memberUsers', (err, workspace) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(workspace);
        });*/
    });
}


module.exports = {createWorkspace, getWorkspace, addProject, removeProject, addUser, removeUser}