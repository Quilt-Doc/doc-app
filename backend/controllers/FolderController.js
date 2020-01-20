const Folder = require('../models/Folder');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createFolder = (req, res) => {

    const {projectID, userID, parentID, title, codebaseID, description, canWrite, canRead, debugID} = req.body;

    if (!typeof projectID == 'undefined' && projectID !== null) return res.json({success: false, error: 'no folder projectID provided'});
    if (!typeof userID == 'undefined' && userID !== null) return res.json({success: false, error: 'no folder userID provided'});
    if (!typeof parentID == 'undefined' && parentID !== null) return res.json({success: false, error: 'no folder parentID provided'});
    if (!typeof title == 'undefined' && title !== null) return res.json({success: false, error: 'no folder title provided'});

    let folder = new Folder({
        name: name,
        project: projectID,
        creator: ObjectId(userID),
        parent: parentID,
        title: title,
        canWrite: [ObjectId(userID)],
        canRead: [ObjectId(userID)]
    });

    // Check if user-defined ids allowed
    if (process.env.DEBUG_CUSTOM_ID && process.env.DEBUG_CUSTOM_ID != 0) {
        if (debugID) folder._id = ObjectId(debugID);
    }

    if (codebaseID) folder.codebaseID = codebaseID;
    if (description) folder.description = description;
    if (canWrite) folder.canWrite = folder.canWrite.concat(canWrite.map(userID => ObjectId(userID)));
    if (canRead) folder.canRead = folder.canRead.concat(canRead.map(userID => ObjectId(userID)));

    folder.save((err, folder) => {
        if (err) return res.json({ success: false, error: err });
        return folder.populate('parent').populate('project')
        .populate('codebase').populate('creator')
        .populate('canWrite').populate('canRead', (err, folder) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(folder);
        });
    });
}

editFolder = (req, res) => {
    const { id } = req.params; 
    const {parentID, title, description} = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});

    let update = {}
    if (parentID) update.parent = ObjectId(parentID);
    if (title) update.title = title;
    if (description) update.description = description;

    Folder.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, folder) => {
        if (err) return res.json({ success: false, error: err });
        folder.populate('parent').populate('project')
        .populate('codebase').populate('creator')
        .populate('canWrite').populate('canRead')
        .populate('tags').populate('snippets')
        .populate('uploadFiles', (err, folder) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(folder);
        });
    });
}
getFolder = (req, res) => {
    const { id } = req.params; 
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});

    Folder.findById(id, (err, folder) => {
		if (err) return res.json({success: false, error: err});
		folder.populate('workspaces', (err, user) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(user);
        });
    });
}

deleteFolder = (req, res) => {
    const { id } = req.params; 
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});

    Folder.findByIdAndRemove(id, (err, folder) => {
		if (err) return res.json({success: false, error: err});
		folder.populate('parent').populate('project')
        .populate('codebase').populate('creator')
        .populate('canWrite').populate('canRead')
        .populate('tags').populate('snippets')
        .populate('uploadFiles', (err, folder) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(folder);
        });
    });
}

retrieveFolders = (req, res) => {
    
    // (projectID, parentID, codebaseID, textQuery, tagIDs, snippetIDs)

}


attachSnippet = (req, res) => {
    const { id } = req.params;
    const { snippetID } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof snippetID == 'undefined' && snippetID !== null) return res.json({success: false, error: 'no snippet id provided'});

    let update = {}
    update.snippets = ObjectId(snippetID);

    Folder.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, folder) => {
        if (err) return res.json({ success: false, error: err });
        folder.populate('parent').populate('project')
        .populate('codebase').populate('creator')
        .populate('canWrite').populate('canRead')
        .populate('tags').populate('snippets')
        .populate('uploadFiles', (err, folder) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(folder);
        });
    });
}

removeSnippet = (req, res) => {
    const { id } = req.params;
    const { snippetID } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof snippetID == 'undefined' && snippetID !== null) return res.json({success: false, error: 'no snippet id provided'});

    let update = {}
    update.snippets = ObjectId(snippetID);

    Folder.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, folder) => {
		if (err) return res.json({success: false, error: err});
		folder.populate('parent').populate('project')
        .populate('codebase').populate('creator')
        .populate('canWrite').populate('canRead')
        .populate('tags').populate('snippets')
        .populate('uploadFiles', (err, folder) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(folder);
        });
    });

}

attachUploadFile = (req, res) => {
    const { id } = req.params;
    const { uploadFileID } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof uploadFileID == 'undefined' && uploadFileID !== null) return res.json({success: false, error: 'no uploadFileID provided'});

    let update = {}
    update.uploadFiles = ObjectId(uploadFileID);

    Folder.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, folder) => {
        if (err) return res.json({ success: false, error: err });
        folder.populate('parent').populate('project')
        .populate('codebase').populate('creator')
        .populate('canWrite').populate('canRead')
        .populate('tags').populate('snippets')
        .populate('uploadFiles', (err, folder) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(folder);
        });
    });
}

removeUploadFile = (req, res) => {
    const { id } = req.params;
    const { uploadFileID } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof uploadFileID == 'undefined' && uploadFileID !== null) return res.json({success: false, error: 'no uploadFileID provided'});

    let update = {}
    update.uploadFiles = ObjectId(uploadFileID);

    Folder.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, folder) => {
		if (err) return res.json({success: false, error: err});
		folder.populate('parent').populate('project')
        .populate('codebase').populate('creator')
        .populate('canWrite').populate('canRead')
        .populate('tags').populate('snippets')
        .populate('uploadFiles', (err, folder) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(folder);
        });
    });
}


// TODO: 
    // attachTag(folderID, tagID)
    // removeTag(folderID, tagID)

    // addCanWrite(folderID, userID)
    // removeCanWrite(folderID, userID)

    // addCanRead(folderID, userID)
    // removeCanRead(folderID, userID)


module.exports =
{
     createFolder, editFolder, getFolder, deleteFolder, retrieveFolders,
     attachSnippet, removeSnippet, attachUploadFile, removeUploadFile
}