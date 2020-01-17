const Workspace = require('../models/Workspace');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createWorkspace = (req, res) => {
    // try{req.body = JSON.parse(Object.keys(req.body)[0])}catch(err){req.body = req.body}
    console.log(req.body);
    const {name, creatorId} = req.body;
    console.log('name: ' + name);
    console.log('creatorId: ' + creatorId);
    if (!typeof name == 'undefined' && name !== null) return res.json({success: false, error: 'no workspace name provided'});
    if (!typeof creatorId == 'undefined' && creatorId !== null) return res.json({success: false, error: 'no workspace creator ID provided'});

    let workspace = new Workspace({
        name: name,
        creator: ObjectId(creatorId),
        memberUsers: [ObjectId(creatorId)]
    });

    workspace.save((err, workspace) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(workspace);
        /*workspace.populate('projects')
        .populate('memberUsers', (err, workspace) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(workspace);
        });*/
    });
}

module.exports = {createWorkspace}