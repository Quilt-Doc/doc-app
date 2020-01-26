const Folder = require('../models/Folder');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createFolder = (req, res) => {

    const {userID, parentID, title, codebaseID, description, canWrite, canRead, debugID} = req.body;

    if (!typeof userID == 'undefined' && userID !== null) return res.json({success: false, error: 'no folder userID provided'});
    if (!typeof parentID == 'undefined' && parentID !== null) return res.json({success: false, error: 'no folder parentID provided'});
    if (!typeof title == 'undefined' && title !== null) return res.json({success: false, error: 'no folder title provided'});

    let folder = new Folder({
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

    if (codebaseID) folder.codebase = codebaseID;
    if (description) folder.description = description;
    if (canWrite) folder.canWrite = folder.canWrite.concat(canWrite.map(userID => ObjectId(userID)));
    if (canRead) folder.canRead = folder.canRead.concat(canRead.map(userID => ObjectId(userID)));

    console.log('Creator:');
    console.log(folder.creator);

    folder.save((err, folder) => {
        if (err) return res.json({ success: false, error: err });
        return folder.populate('parent')
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
        folder.populate('parent')
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
        folder.populate('parent')
        .populate('codebase').populate('creator')
        .populate('canWrite').populate('canRead')
        .populate('tags').populate('snippets')
        .populate('uploadFiles', (err, folder) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(folder);
        });
    });
}

deleteFolder = (req, res) => {
    const { id } = req.params; 
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});

    Folder.findByIdAndRemove(id, (err, folder) => {
		if (err) return res.json({success: false, error: err});
		folder.populate('parent')
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
    const {parentID, codebaseID, textQuery, tagIDs, snippetsIDs, limit, skip} = req.body;
    // (parentID, codebaseID, textQuery, tagIDs, snippetIDs)

    query = Folder.find();
    if (parentID) query.where('parent').equals(parentID);
    if (codebaseID) query.where('codebase').equals(codebaseID);
    // if (textQuery) query.where('codebase').all(tagIDs);
    if (tagIDs) query.where('tags').all(tagIDs);
    if (snippetsIDs) query.where('snippets').all(snippetsIDs);

    if (limit) query.limit(Number(limit));
    if (skip) query.skip(Number(skip));

    query.populate('parent')
    .populate('codebase').populate('creator')
    .populate('canWrite').populate('canRead')
    .populate('tags').populate('snippets')
    .populate('uploadFiles').exec((err, folders) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(folders);
    });
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
        folder.populate('parent')
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
		folder.populate('parent')
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
        folder.populate('parent')
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
		folder.populate('parent')
        .populate('codebase').populate('creator')
        .populate('canWrite').populate('canRead')
        .populate('tags').populate('snippets')
        .populate('uploadFiles', (err, folder) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(folder);
        });
    });
}


attachTag = (req, res) => {
    const { id } = req.params;
    const { tagID } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof tagID == 'undefined' && tagID !== null) return res.json({success: false, error: 'no tagID provided'});

    let update = {}
    update.tags = ObjectId(tagID);

    Folder.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, folder) => {
        if (err) return res.json({ success: false, error: err });
        folder.populate('parent')
        .populate('codebase').populate('creator')
        .populate('canWrite').populate('canRead')
        .populate('tags').populate('snippets')
        .populate('uploadFiles', (err, folder) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(folder);
        });
    });
}

removeTag = (req, res) => {
    const { id } = req.params;
    const { tagID } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof tagID == 'undefined' && tagID !== null) return res.json({success: false, error: 'no tagID provided'});

    let update = {}
    update.tags = ObjectId(tagID);

    Folder.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, folder) => {
		if (err) return res.json({success: false, error: err});
		folder.populate('parent')
        .populate('codebase').populate('creator')
        .populate('canWrite').populate('canRead')
        .populate('tags').populate('snippets')
        .populate('uploadFiles', (err, folder) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(folder);
        });
    });
}

addCanWrite = (req, res) => {
    const { id } = req.params;
    const { userID } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof userID == 'undefined' && userID !== null) return res.json({success: false, error: 'no userID provided'});

    let update = {}
    update.canWrite = ObjectId(userID);

    Folder.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, folder) => {
        if (err) return res.json({ success: false, error: err });
        folder.populate('parent')
        .populate('codebase').populate('creator')
        .populate('canWrite').populate('canRead')
        .populate('tags').populate('snippets')
        .populate('uploadFiles', (err, folder) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(folder);
        });
    });
}

removeCanWrite = (req, res) => {
    const { id } = req.params;
    const { userID } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof userID == 'undefined' && userID !== null) return res.json({success: false, error: 'no userID provided'});

    let update = {}
    update.canWrite = ObjectId(userID);

    Folder.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, folder) => {
		if (err) return res.json({success: false, error: err});
		folder.populate('parent')
        .populate('codebase').populate('creator')
        .populate('canWrite').populate('canRead')
        .populate('tags').populate('snippets')
        .populate('uploadFiles', (err, folder) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(folder);
        });
    });
}

addCanRead = (req, res) => {
    const { id } = req.params;
    const { userID } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof userID == 'undefined' && userID !== null) return res.json({success: false, error: 'no userID provided'});

    let update = {}
    update.canRead = ObjectId(userID);

    Folder.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, folder) => {
        if (err) return res.json({ success: false, error: err });
        folder.populate('parent')
        .populate('codebase').populate('creator')
        .populate('canWrite').populate('canRead')
        .populate('tags').populate('snippets')
        .populate('uploadFiles', (err, folder) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(folder);
        });
    });
}

removeCanRead = (req, res) => {
    const { id } = req.params;
    const { userID } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof userID == 'undefined' && userID !== null) return res.json({success: false, error: 'no userID provided'});

    let update = {}
    update.canRead = ObjectId(userID);

    Folder.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, folder) => {
		if (err) return res.json({success: false, error: err});
		folder.populate('parent')
        .populate('codebase').populate('creator')
        .populate('canWrite').populate('canRead')
        .populate('tags').populate('snippets')
        .populate('uploadFiles', (err, folder) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(folder);
        });
    });
}


module.exports =
{
     createFolder, editFolder, getFolder, deleteFolder, retrieveFolders,
     attachSnippet, removeSnippet, attachUploadFile, removeUploadFile,
     attachTag, removeTag, addCanWrite, removeCanWrite, addCanRead, removeCanRead

}