const Codebase = require('../models/Codebase');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createCodebase = (req, res) => {

    console.log(req.body);
    const {name, workspaceID, link, debugID} = req.body;

    if (!typeof workspaceID == 'undefined' && workspaceID !== null) return res.json({success: false, error: 'no codebase workspace provided'});
    if (!typeof name == 'undefined' && name !== null) return res.json({success: false, error: 'no codebase name provided'});

    let codebase = new Codebase({
        name: name,
        workspaceID: ObjectId(workspaceID)
    });

    // Check if user-defined ids allowed
    if (process.env.DEBUG_CUSTOM_ID && process.env.DEBUG_CUSTOM_ID != 0) {
        if (debugID) codebase._id = ObjectId(debugID);
    }

    if (link) codebase.link = link;
    

    codebase.save((err, codebase) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(codebase);
        /*codebase.populate('workspace') (err, codebase) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(codebase);
        });*/
    });
}

getCodebase = (req, res) => {
    // try{req.body = JSON.parse(Object.keys(req.body)[0])}catch(err){req.body = req.body}
    console.log(req.body);
    const { id } = req.params;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no codebase id provided'});
    Codebase.findById(id, (err, codebase) => {
		if (err) return res.json({success: false, error: err});
        return res.json(codebase);
        /*codebase.populate('workspace') (err, codebase) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(codebase);
        });*/
    });
}

module.exports = {createCodebase, getCodebase}
