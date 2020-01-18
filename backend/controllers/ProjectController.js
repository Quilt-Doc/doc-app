const Project = require('../models/Project');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createProject = (req, res) => {
    // try{req.body = JSON.parse(Object.keys(req.body)[0])}catch(err){req.body = req.body}
    console.log(req.body);
    const {name, creatorId, description, userIds, codebaseIds, debugId} = req.body;
    console.log('name: ' + name);
    console.log('creatorId: ' + creatorId);
    if (!typeof name == 'undefined' && name !== null) return res.json({success: false, error: 'no project name provided'});
    if (!typeof creatorId == 'undefined' && creatorId !== null) return res.json({success: false, error: 'no project creator ID provided'});

    let project = new Project({
        name: name,
        creator: ObjectId(creatorId),
        users: [ObjectId(creatorId)]
    });

    // Check if user-defined ids allowed
    if (process.env.DEBUG_CUSTOM_ID && process.env.DEBUG_CUSTOM_ID != 0) {
        if (debugId) project._id = ObjectId(debugId);
    }

    if (description) project.description = description;
    if (userIds) project.users.concat(userIds.map(userId => ObjectId(userId)));
    if (codebaseIds) project.codebases = codebaseIds.map(codebaseId => ObjectId(codebaseId));

    project.save((err, project) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(project);
        /*project.populate('creator').populat('users')
        .populate('codebases', (err, project) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(project);
        });*/
    });
}

getProject = (req, res) => {

    console.log(req.params.id);
    id = req.params.id;
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no project id provided'});
    Project.findById(id, (err, project) => {
		if (err) return res.json({success: false, error: err});
		return res.json(project);
    });
    /*project.populate('creator').populat('users')
        .populate('codebases', (err, project) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(project);
        });*/
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
            return res.json(project);
    });
    /*project.populate('creator').populat('users')
        .populate('codebases', (err, project) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(project);
        });*/
}


deleteProject = (req, res) => {

    const { id } = req.params;
    
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no project id provided'});

    Project.findByIdAndRemove(id, (err, project) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(project);
    });
    /*project.populate('creator').populat('users')
        .populate('codebases', (err, project) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(project);
        });*/
}

importCodebase = (req, res) => {

    const { id } = req.params;
    const {codebaseId} = req.body;
    
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no project id provided'});
    if (!typeof codebaseId == 'undefined' && codebaseId !== null) return res.json({success: false, error: 'no codebase id provided'});

    let update = {};
    update.codebases = codebaseId;

    Project.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, project) => {
        if (err) return res.json({ success: false, error: err });
            return res.json(project);
    });
    /*project.populate('creator').populat('users')
        .populate('codebases', (err, project) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(project);
        });*/
}


removeCodebase = (req, res) => {

    const { id } = req.params;
    const {codebaseId} = req.body;
    
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no project id provided'});
    if (!typeof codebaseId == 'undefined' && codebaseId !== null) return res.json({success: false, error: 'no codebase id provided'});

    let update = {};
    update.codebases = codebaseId;

    Project.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, project) => {
        if (err) return res.json({ success: false, error: err });
            return res.json(project);
    });
    /*project.populate('creator').populat('users')
        .populate('codebases', (err, project) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(project);
        });*/
}





module.exports = {createProject, getProject, editProject, deleteProject, importCodebase, removeCodebase}
