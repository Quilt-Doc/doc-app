const Document = require('../models/Document');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true
    }
    return false
}

createDocument = (req, res) => {
    const { authorID, referenceIDs, childrenIDs, repositoryID, workspaceID, title, root, markup, tagIDs } = req.body;
    
    //if (!typeof author == 'undefined' && author !== null) return res.json({success: false, error: 'no document author provided'});
    //if (!typeof title == 'undefined' && title !== null) return res.json({success: false, error: 'no document title provided'});

    let document = new Document(
        {
            author: ObjectId(authorID),
            repository: ObjectId(repositoryID),
            workspace: ObjectId(workspaceID),
            title,
        },
    );

    if (checkValid(referenceIDs)) {
        document.references = referenceIDs.map(referenceID => ObjectId(referenceID))
    }

    if (checkValid(childrenIDs)){
        document.children = childrenIDs.map(childrenID => ObjectId(childrenID))
    }

    if (checkValid(root)){
        console.log(root)
        document.root = root
    }


    document.save((err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('repository').populate('workspace').populate('references').populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

getDocument = (req, res) => {
    Document.findById(req.params.id).populate('repository').populate('workspace').populate('references').populate('tags').exec(function (err, document) {
        if (err) return res.json({ success: false, error: err });
        return res.json(document);
    });
}



editDocument = (req, res) => {
    const { id } = req.params;
    const { title, markup } = req.body;
    let update = {};
    if (title) update.title = title;
    if (markup) update.markup = markup;
    Document.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author', (err, document) => {
            if (err) return res.json(err);
            return res.json(document);
        });
    });
}


deleteDocument = (req, res) => {
    const { id } = req.params;
    Document.findByIdAndRemove(id, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

retrieveDocuments = (req, res) => {
    let { textQuery, authorID, childrenIDs, workspaceID, repositoryID, referenceIDs, root, tagIDs, limit, skip } = req.body;
    
    let query = Document.find({});
    if (checkValid(root)) query.where('root').equals(root);
    if (checkValid(authorID)) query.where('author').equals(authorID);
    if (checkValid(workspaceID)) query.where('workspace').equals(workspaceID);
    if (checkValid(repositoryID)) query.where('repository').equals(repositoryID);
    if (checkValid(childrenIDs)) query.where('_id').in(childrenIDs);
    if (checkValid(tagIDs)) query.where('tags').all(tagIDs);
    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));
    query.populate('author').populate('workspace').populate('repository').populate('references').populate('tags').exec((err, documents) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(documents);
    });
}



attachTag = (req, res) => {
    const { id } = req.params;
    const { tagID } = req.body;
    let update = {};
    if (tagID) update.tags = ObjectId(tagID);
    Document.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}


removeTag = (req, res) => {
    const { id } = req.params;
    const { tagID } = req.body;
    let update = {};
    if (tagID) update.tags = ObjectId(tagID);
    Document.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}


attachChild = (req, res) => {
    const { id } = req.params;
    const { childID } = req.body;
    let update = {};
    if (childID) update.children = ObjectId(childID);
    Document.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('workspace').populate('repository').populate('references').populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

removeChild = (req, res) => {
    const { id } = req.params;
    const { childID } = req.body;
    let update = {};
    if (childID) update.children = ObjectId(childID);
    Document.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('workspace').populate('repository').populate('references').populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

removeTag = (req, res) => {
    const { id } = req.params;
    const { tagID } = req.body;
    let update = {};
    if (tagID) update.tags = ObjectId(tagID);
    Document.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

attachSnippet = (req, res) => {
    const { id } = req.params;
    const { snippetID } = req.body;
    let update = {};
    if (snippetID) update.snippets = ObjectId(snippetID);
    Document.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}


removeSnippet = (req, res) => {
    const { id } = req.params;
    const { snippetID } = req.body;
    let update = {};
    if (snippetID) update.snippets = ObjectId(snippetID);
    Document.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}


attachParent = (req, res) => {
    const { id } = req.params;
    const { parentID } = req.body;
    let update = {};
    if (parentID) update.parents = ObjectId(parentID);
    Document.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}


removeParent = (req, res) => {
    const { id } = req.params;
    const { parentID } = req.body;
    let update = {};
    if (parentID) update.parents = ObjectId(parentID);
    Document.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}


attachUploadFile = (req, res) => {
    const { id } = req.params;
    const { uploadFileID } = req.body;
    let update = {};
    if (uploadFileID) update.uploadFiles = ObjectId(uploadFileID);
    Document.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

removeUploadFile = (req, res) => {
    const { id } = req.params;
    const { uploadFileID } = req.body;
    let update = {};
    if (uploadFileID) update.uploadFiles = ObjectId(uploadFileID);
    Document.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

addCanWrite = (req, res) => {
    const { id } = req.params;
    const { userID } = req.body;
    let update = {};
    if (userID) update.canWrite = ObjectId(userID);
    Document.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

removeCanWrite = (req, res) => {
    const { id } = req.params;
    const { userID } = req.body;
    let update = {};
    if (userID) update.canWrite = ObjectId(userID);
    Document.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

addCanRead = (req, res) => {
    const { id } = req.params;
    const { userID } = req.body;
    let update = {};
    if (userID) update.canRead = ObjectId(userID);
    Document.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

removeCanRead = (req, res) => {
    const { id } = req.params;
    const { userID } = req.body;
    let update = {};
    if (userID) update.canRead = ObjectId(userID);
    Document.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}


module.exports = { createDocument, getDocument, editDocument, 
    deleteDocument, retrieveDocuments, attachTag, removeTag, 
    attachSnippet, removeSnippet, attachParent, removeParent, 
    attachUploadFile, removeUploadFile, addCanWrite, removeCanWrite, 
    addCanRead, removeCanRead, attachChild, removeChild }
