const Project = require('../models/Project');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createProject = (req, res) => {

    const {name, creatorID, description, userIDs, codebaseIDs, debugID} = req.body;

    if (!typeof name == 'undefined' && name !== null) return res.json({success: false, error: 'no project name provided'});
    if (!typeof creatorID == 'undefined' && creatorID !== null) return res.json({success: false, error: 'no project creator ID provided'});

    let project = new Project({
        name: name,
        creator: ObjectId(creatorID),
        users: [ObjectId(creatorID)]
    });

    // Check if user-defined ids allowed
    if (process.env.DEBUG_CUSTOM_ID && process.env.DEBUG_CUSTOM_ID != 0) {
        if (debugID) project._id = ObjectId(debugID);
    }

    if (description) project.description = description;
    if (userIDs) project.users.concat(userIDs.map(userID => ObjectId(userID)));
    if (codebaseIDs) project.codebases = codebaseIDs.map(codebaseID => ObjectId(codebaseID));

    project.save((err, project) => {
        if (err) return res.json({ success: false, error: err });
        project.populate('creator').populate('users')
        .populate('codebases', (err, project) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(project);
        });
    });
}

getProject = (req, res) => {

    console.log(req.params.id);
    id = req.params.id;
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no project id provided'});
    Project.findById(id, (err, project) => {
		if (err) return res.json({success: false, error: err});
		project.populate('creator').populate('users')
        .populate('codebases', (err, project) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(project);
        });
    });
}


editProject = (req, res) => {

    const { id } = req.params;
    const {name, description} = req.body;
    
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no project id provided'});
    
    let update = {};
    if (name) update.name = name;
    if (description) update.description = description;

    Project.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, project) => {
        if (err) return res.json({ success: false, error: err });
            if (err) return res.json(err);
            project.populate('creator').populate('users')
            .populate('codebases', (err, project) => {
                if (err) return res.json({ success: false, error: err });
                return res.json(project);
        });
    });
}


deleteProject = (req, res) => {

    const { id } = req.params;
    
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no project id provided'});

    Project.findByIdAndRemove(id, (err, project) => {
        if (err) return res.json({ success: false, error: err });
        project.populate('creator').populate('users')
        .populate('codebases', (err, project) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(project);
        });
    });
}

importCodebase = (req, res) => {

    const { id } = req.params;
    const {codebaseID} = req.body;
    
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no project id provided'});
    if (!typeof codebaseID == 'undefined' && codebaseID !== null) return res.json({success: false, error: 'no codebase id provided'});

    let update = {};
    update.codebases = codebaseID;

    Project.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, project) => {
        if (err) return res.json({ success: false, error: err });
        project.populate('creator').populate('users')
        .populate('codebases', (err, project) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(project);
        });
    });
}


removeCodebase = (req, res) => {

    const { id } = req.params;
    const {codebaseID} = req.body;
    
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no project id provided'});
    if (!typeof codebaseID == 'undefined' && codebaseID !== null) return res.json({success: false, error: 'no codebase id provided'});

    let update = {};
    update.codebases = codebaseID;

    Project.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, project) => {
        if (err) return res.json({ success: false, error: err });
        project.populate('creator').populate('users')
        .populate('codebases', (err, project) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(project);
        });
    });
}





module.exports = {createProject, getProject, editProject, deleteProject, importCodebase, removeCodebase}
