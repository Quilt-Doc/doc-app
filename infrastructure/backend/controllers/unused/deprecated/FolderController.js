/*
const Folder = require('../../../models/Folder');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


searchWorkspace2 = async (req, res) => {
    const { workspaceId, userQuery, repositoryId, tagIds, returnLinkages,
            returnReferences, returnDocuments, requestedPageSize, requestedPageNumber, sort, mix } = req.body;

    // for the `returnReferences`, `returnDocuments` params, put a string "true" if you want to do it
    if (!checkValid(workspaceId)) return res.json({success: false, result: null, error: 'searchWorkspace: error no workspaceId provided.'});
    if (!checkValid(userQuery)) return res.json({success: false, result: null, error: 'searchWorkspace: error no userQuery provided.'});
    if (!checkValid(returnReferences)) return res.json({success: false, result: null, error: 'searchWorkspace: error no returnReferences provided.'});
    if (!checkValid(returnDocuments)) return res.json({success: false, result: null, error: 'searchWorkspace: error no returnDocuments provided.'});
    if (!checkValid(returnLinkages)) return res.json({success: false, result: null, error: 'searchWorkspace: error no returnLinkages provided.'});

    var searchResults = {};

    var pageSize = checkValid(requestedPageSize) ? parseInt(requestedPageSize) : PAGE_SIZE;
    var pageNumber = checkValid(requestedPageNumber) ? parseInt(requestedPageNumber) : 0;

    var re = new RegExp(escapeRegExp(userQuery), 'i');

    var documentFilter;
    if (tagIds) {
        documentFilter = {title: {$regex: re}, workspace: workspaceId, tags: {$in: tagIds.map(tag => ObjectId(tag))}};
    }
    else {
        documentFilter = {title: {$regex: re}, workspace: workspaceId};
    }

    let linkageFilter;
    if (tagIds) {
        linkageFilter = {title: {$regex: re}, workspace: workspaceId, tags: {$in: tagIds.map(tag => ObjectId(tag))}};
    }
    else {
        linkageFilter = {title: {$regex: re}, workspace: workspaceId};
    }

    var referenceFilter;

    if (!repositoryId) {
        var searchableRepositories = await Workspace.findById(workspaceId);
        searchableRepositories = searchableRepositories.repositories.map(repositoryObj => repositoryObj._id.toString());

        referenceFilter = {
            repository: { $in:  searchableRepositories.map(obj => ObjectId(obj))},
            name: { $regex: re}
        };
    }

    else {
        referenceFilter = {
            repository: ObjectId(repositoryId),
            name: { $regex: re}
        };
    }

    let documents = [];
    let references = [];
    let linkages = [];

    if (returnDocuments === true) {
        documents = await Document.find(documentFilter)
            .skip(pageNumber*pageSize).limit(pageSize).sort(sort)
            .populate('parent').populate('author').populate('workspace')
            .populate('repository').populate('references')
            .populate('tags').exec();
    }

    if (returnReferences === true) {
        references = await Reference.find(referenceFilter).skip(pageNumber*pageSize).sort(sort)
            .limit(pageSize).populate('repository').populate('tags').exec();
    }
  
    if (returnLinkages === true) {
        linkages = await Linkage.find(linkageFilter).skip(pageNumber*pageSize).sort(sort)
            .limit(pageSize).populate('references').populate('workspace').populate('repository').populate('creator').exec();
    }

    if (mix) {
        searchResults = [...documents, ...linkages, ...references];
    } else {
        searchResults = {documents, references, linkages};
    }
    return res.json({success: true, result: searchResults});
}


createFolder = (req, res) => {

    const {workspaceId, creatorId, parentId, title, repositoryId, description, canWrite, canRead, debugId} = req.body;

    if (!typeof workspaceId == 'undefined' && workspaceId !== null) return res.json({success: false, error: 'no folder workspaceId provided'});
    if (!typeof creatorId == 'undefined' && creatorId !== null) return res.json({success: false, error: 'no folder creatorId provided'});
    //if (!typeof parentId == 'undefined' && parentId !== null) return res.json({success: false, error: 'no folder parentId provided'});
    if (!typeof title == 'undefined' && title !== null) return res.json({success: false, error: 'no folder title provided'});

    let folder = new Folder({
        workspace: ObjectId(workspaceId),
        creator: ObjectId(creatorId),
        title: title,
        canWrite: [ObjectId(creatorId)],
        canRead: [ObjectId(creatorId)]
    });

    // Check if user-defined ids allowed
    if (process.env.DEBUG_CUSTOM_Id && process.env.DEBUG_CUSTOM_Id != 0) {
        if (debugId) folder._id = ObjectId(debugId);
    }
    if (parentId)  folder.parent = ObjectId(parentId); else folder.root = true
    if (repositoryId) folder.repository = ObjectId(repositoryId);
    if (description) folder.description = description;
    if (canWrite) folder.canWrite = folder.canWrite.concat(canWrite.map(creatorId => ObjectId(creatorId)));
    if (canRead) folder.canRead = folder.canRead.concat(canRead.map(creatorId => ObjectId(creatorId)));
    folder.save((err, folder) => {
        if (err) return res.json({ success: false, error: err });
        return folder.populate('parent')
        .populate('repository').populate('creator')
        .populate('canWrite').populate('canRead', (err, folder) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(folder);
        });
    });
}

editFolder = (req, res) => {
    const { id } = req.params; 
    const {parentId, title, description} = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});

    let update = {}
    if (parentId) update.parent = ObjectId(parentId);
    if (title) update.title = title;
    if (description) update.description = description;

    Folder.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, folder) => {
        if (err) return res.json({ success: false, error: err });
        folder.populate('parent')
        .populate('repository').populate('creator')
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
        .populate('repository').populate('creator')
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
        .populate('repository').populate('creator')
        .populate('canWrite').populate('canRead')
        .populate('tags').populate('snippets')
        .populate('uploadFiles', (err, folder) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(folder);
        });
    });
}

retrieveFolders = (req, res) => {
    const {title, workspaceId, parentId, repositoryId, textQuery, tagIds, snippetsIds, limit, skip, root} = req.body;
    // (parentId, repositoryId, textQuery, tagIds, snippetIds)

    query = Folder.find();
    if (title) query.where('title').equals(title);
    if (parentId) query.where('parent').equals(parentId);
    if (repositoryId) query.where('repository').equals(repositoryId);
    if (workspaceId) query.where('workspace').equals(workspaceId)
    // if (textQuery) query.where('repository').all(tagIds);
    if (tagIds) query.where('tags').all(tagIds);
    if (root) query.where('root').equals(root)
    if (snippetsIds) query.where('snippets').all(snippetsIds);
    if (limit) query.limit(Number(limit));
    if (skip) query.skip(Number(skip));

    query.populate('parent')
    .populate('repository').populate('creator')
    .populate('canWrite').populate('canRead')
    .populate('tags').populate('snippets')
    .populate('uploadFiles').populate('workspace').exec((err, folders) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(folders);
    });
}


attachSnippet = (req, res) => {
    const { id } = req.params;
    const { snippetId } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof snippetId == 'undefined' && snippetId !== null) return res.json({success: false, error: 'no snippet id provided'});

    let update = {}
    update.snippets = ObjectId(snippetId);

    Folder.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, folder) => {
        if (err) return res.json({ success: false, error: err });
        folder.populate('parent')
        .populate('repository').populate('creator')
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
    const { snippetId } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof snippetId == 'undefined' && snippetId !== null) return res.json({success: false, error: 'no snippet id provided'});

    let update = {}
    update.snippets = ObjectId(snippetId);

    Folder.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, folder) => {
		if (err) return res.json({success: false, error: err});
		folder.populate('parent')
        .populate('repository').populate('creator')
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
    const { uploadFileId } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof uploadFileId == 'undefined' && uploadFileId !== null) return res.json({success: false, error: 'no uploadFileId provided'});

    let update = {}
    update.uploadFiles = ObjectId(uploadFileId);

    Folder.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, folder) => {
        if (err) return res.json({ success: false, error: err });
        folder.populate('parent')
        .populate('repository').populate('creator')
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
    const { uploadFileId } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof uploadFileId == 'undefined' && uploadFileId !== null) return res.json({success: false, error: 'no uploadFileId provided'});

    let update = {}
    update.uploadFiles = ObjectId(uploadFileId);

    Folder.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, folder) => {
		if (err) return res.json({success: false, error: err});
		folder.populate('parent')
        .populate('repository').populate('creator')
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
    const { tagId } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof tagId == 'undefined' && tagId !== null) return res.json({success: false, error: 'no tagId provided'});

    let update = {}
    update.tags = ObjectId(tagId);

    Folder.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, folder) => {
        if (err) return res.json({ success: false, error: err });
        folder.populate('parent')
        .populate('repository').populate('creator')
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
    const { tagId } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof tagId == 'undefined' && tagId !== null) return res.json({success: false, error: 'no tagId provided'});

    let update = {}
    update.tags = ObjectId(tagId);

    Folder.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, folder) => {
		if (err) return res.json({success: false, error: err});
		folder.populate('parent')
        .populate('repository').populate('creator')
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
    const { creatorId } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof creatorId == 'undefined' && creatorId !== null) return res.json({success: false, error: 'no creatorId provided'});

    let update = {}
    update.canWrite = ObjectId(creatorId);

    Folder.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, folder) => {
        if (err) return res.json({ success: false, error: err });
        folder.populate('parent')
        .populate('repository').populate('creator')
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
    const { creatorId } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof creatorId == 'undefined' && creatorId !== null) return res.json({success: false, error: 'no creatorId provided'});

    let update = {}
    update.canWrite = ObjectId(creatorId);

    Folder.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, folder) => {
		if (err) return res.json({success: false, error: err});
		folder.populate('parent')
        .populate('repository').populate('creator')
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
    const { creatorId } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof creatorId == 'undefined' && creatorId !== null) return res.json({success: false, error: 'no creatorId provided'});

    let update = {}
    update.canRead = ObjectId(creatorId);

    Folder.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, folder) => {
        if (err) return res.json({ success: false, error: err });
        folder.populate('parent')
        .populate('repository').populate('creator')
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
    const { creatorId } = req.body;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no folder id provided'});
    if (!typeof creatorId == 'undefined' && creatorId !== null) return res.json({success: false, error: 'no creatorId provided'});

    let update = {}
    update.canRead = ObjectId(creatorId);

    Folder.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, folder) => {
		if (err) return res.json({success: false, error: err});
		folder.populate('parent')
        .populate('repository').populate('creator')
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
*/