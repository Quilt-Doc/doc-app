const Workspace = require('../models/Workspace');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createWorkspace = (req, res) => {
    // try{req.body = JSON.parse(Object.keys(req.body)[0])}catch(err){req.body = req.body}
    console.log(req.body);
    const {name, creatorID, debugID} = req.body;
    console.log('name: ' + name);
    console.log('creatorID: ' + creatorID);
    if (!typeof name == 'undefined' && name !== null) return res.json({success: false, error: 'no workspace name provided'});
    if (!typeof creatorID == 'undefined' && creatorID !== null) return res.json({success: false, error: 'no workspace creator ID provided'});

    let workspace = new Workspace({
        name: name,
        creator: ObjectId(creatorID),
        memberUsers: [ObjectId(creatorID)]
    });

    // Check if user-defined ids allowed
    if (process.env.DEBUG_CUSTOM_ID && process.env.DEBUG_CUSTOM_ID != 0) {
        if (debugID) workspace._id = ObjectId(debugID);
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
    const { projectID } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no workspace id provided'});
    if (!typeof projectID == 'undefined' && projectID !== null) return res.json({success: false, error: 'no project id provided'});

    let update = {};
    if (projectID) update.projects = ObjectId(projectID);

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
    const { projectID } = req.body;
    
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no workspace id provided'});
    if (!typeof projectID == 'undefined' && projectID !== null) return res.json({success: false, error: 'no project id provided'});

    let update = {};
    if (projectID) update.projects = ObjectId(projectID);

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
    const { userID } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no workspace id provided'});
    if (!typeof userID == 'undefined' && userID !== null) return res.json({success: false, error: 'no user id provided'});

    let update = {};
    if (userID) update.memberUsers = ObjectId(userID);

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
    const { userID } = req.body;
    
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no workspace id provided'});
    if (!typeof userID == 'undefined' && projectID !== null) return res.json({success: false, error: 'no user id provided'});

    let update = {};
    if (userID) update.memberUsers = ObjectId(userID);

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