const Folder = require('../models/Folder');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createFolder = (req, res) => {

    const {projectID, codebaseID, userID, parentID, title, description, canWrite, canRead, debugID} = req.body;

    if (!typeof projectID == 'undefined' && projectID !== null) return res.json({success: false, error: 'no codebase projectID provided'});
    if (!typeof projectID == 'undefined' && projectID !== null) return res.json({success: false, error: 'no codebase projectID provided'});
    if (!typeof projectID == 'undefined' && projectID !== null) return res.json({success: false, error: 'no codebase projectID provided'});

}





module.exports = {createFolder}
