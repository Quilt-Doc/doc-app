const Codebase = require('../models/Codebase');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createCodebase = (req, res) => {
    // try{req.body = JSON.parse(Object.keys(req.body)[0])}catch(err){req.body = req.body}
    console.log(req.body);
    const {name, workspaceId, link} = req.body;

    if (!typeof workspaceId == 'undefined' && workspaceId !== null) return res.json({success: false, error: 'no codebase workspace provided'});
    if (!typeof name == 'undefined' && name !== null) return res.json({success: false, error: 'no codebase name provided'});

    let codebase = new Codebase({
        name: name,
        workspaceId: ObjectId(workspaceId)
    });

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
