const Codebase = require('../models/Codebase');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createCodebase = (req, res) => {
    console.log('Called create codebase');
    const {name, workspaceID, link, debugID, icon} = req.body;


    // if (!typeof workspaceID == 'undefined' && workspaceID !== null) return res.json({success: false, error: 'no codebase workspace provided'});
    if (!typeof name == 'undefined' && name !== null) return res.json({success: false, error: 'no codebase name provided'});

    let codebase = new Codebase({
        name: name,
        link,
        icon
    });
    console.log('Link: ', link);

    // Check if user-defined ids allowed
    if (process.env.DEBUG_CUSTOM_ID && process.env.DEBUG_CUSTOM_ID != 0) {
        if (debugID) codebase._id = ObjectId(debugID);
    }

    if (workspaceID) codebase.workspace = ObjectId(workspaceID)
    codebase.save((err, codebase) => {
        console.log(err)
        if (err) return res.json({ success: false, error: err });
        codebase.populate('workspace', (err, codebase) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(codebase);
        });
    });
}

getCodebase = (req, res) => {
    // try{req.body = JSON.parse(Object.keys(req.body)[0])}catch(err){req.body = req.body}
    console.log(req.body);
    const { id } = req.params;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no codebase id provided'});
    Codebase.findById(id, (err, codebase) => {
		if (err) return res.json({success: false, error: err});
        codebase.populate('workspace', (err, codebase) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(codebase);
        });
    });
}

deleteCodebase = (req, res) => {
    const { id } = req.params;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no codebase id provided'});

    Codebase.findByIdAndRemove(id, (err, codebase) => {
		if (err) return res.json({success: false, error: err});
        codebase.populate('workspace', (err, codebase) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(codebase);
        });
    });
}



retrieveCodebases = (req, res) => {
    const {name, workspaceID, link} = req.body;
    // (parentID, codebaseID, textQuery, tagIDs, snippetIDs)

    query = Codebase.find();
    if (name) query.where('name').equals(name);
    if (workspaceID) query.where('workspace').equals(workspaceID);
    if (link) query.where('link').equals(link);

    query.populate('workspace').exec((err, codebases) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(codebases);
    });
}

module.exports = {createCodebase, getCodebase, deleteCodebase, retrieveCodebases}