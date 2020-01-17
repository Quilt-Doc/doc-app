const Workspace = require('../models/Workspace');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createWorkspace = (req, res) => {
    const {name, creatorId} = req.body
    if (!typeof name !== 'undefined' && name !== null) return res.json({success: false, error: 'no workspace name provided'});
    if (!typeof creatorId !== 'undefined' && creatorId !== null) return res.json({success: false, error: 'no workspace creator ID provided'});

    let workspace = new Workspace({
        name: name,
        creator: ObjectId(creatorId),
        memberUsers: [ObjectId(creatorId)]
    })
}

module.exports = {createWorkspace}