const Document = require('../models/Document');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createDocument = (req, res) => {
    const { authorID, parentIDs, snippetIDs, title, description, uploadFileIDs, tagIDs } = req.body;
    let document = new Document(
        {
            author: ObjectId(authorID),
            title,
            parents: parentIDs.map(parentID => ObjectId(parentID)),
            created: new Date(),
        },
    );
    if (snippetIDs) document.snippets = snippetIDs.map(snippetID => ObjectId(snippetID));
    if (description) document.description = description;
    if (uploadFileIDs) document.uploadFiles = uploadFileIDs.map(snippetID => ObjectId(snippetID));
    if (tagIDs) document.tags = tagIDs.map(tagID => ObjectId(tagID))
    document.save((err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

getDocument = (req, res) => {
    Document.findById(req.params.id).populate('author').populate('parents').populate('snippets').populate('uploadFiles')
    .populate('tags').exec(function (err, document) {
        if (err) return res.json({ success: false, error: err });
        return res.json(document);
    });
}



editDocument = (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    let update = {};
    if (title) update.title = title;
    if (description) update.description = description;
    Document.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
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
    let { textQuery, authorID, parentIDs, snippetIDs, uploadFileIDs, tagIDs } = req.body;
    
    query = Document.find();
    if (authorID) query.where('author').equals(authorID);
    if (parentIDs) query.where('parents').all(parentIDs);
    if (tagIDs) query.where('tags').all(tagIDs);
    if (snippetIDs) query.where('snippets').all(snippetIDs);
    if (uploadFileIDs) query.where('uploadFiles').all(uploadFileIDs);
    if (limit) query.limit(Number(limit));
    if (skip) query.skip(Number(skip));
    query.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
    .populate('tags').exec((err, documents) => {
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
    addCanRead, removeCanRead }
