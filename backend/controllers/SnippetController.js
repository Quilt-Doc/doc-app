const Snippet = require('../models/Snippet');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createSnippet = (req, res) => {
    const { folderIDs, documentIDs, location, type, status, name } = req.body;
    let snippet = new Snippet(
        {
            name,
            created: new Date(),
        },
    );
    if (type) snippet.type = type;
    if (status) snippet.status = status;
    if (location) snippet.location = location;
    if (documentIDs) snippet.documents = documentIDs.map(documentID => ObjectId(documentID))
    if (folderIDs) snippet.folders = folderIDs.map(folderID => ObjectId(folderID))
    snippet.save((err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        snippet.populate('folders').populate('documents', (err, snippet) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(snippet);
        });
    });
}

getSnippet = (req, res) => {
    Snippet.findById(req.params.id).populate('folders').populate('documents').exec((err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(snippet);
    });
}



editSnippet = (req, res) => {
    const { id } = req.params;
    const { name, location, type, status } = req.body;
    let update = {};
    if (name) update.name = name;
    if (location) update.location = location;
    if (type) update.type = type;
    if (status) update.status = status;
    Snippet.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        snippet.populate('folders').populate('documents', (err, snippet) => {
            if (err) return res.json(err);
            return res.json(snippet);
        });
    });
}


deleteSnippet = (req, res) => {
    const { id } = req.params;
    Snippet.findByIdAndRemove(id, (err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        snippet.populate('folders').populate('documents', (err, snippet) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(snippet);
        });
    });
}

retrieveSnippets = (req, res) => {
    let { textQuery, name, folderIDs, documentIDs, location, type, status, limit, skip } = req.body;
    query = Snippet.find();
    if (name) query.where('name').equals(location);
    if (location) query.where('location').equals(location);
    if (type) query.where('type').equals(type);
    if (status) query.where('status').equals(status);
    if (folderIDs) query.where('folders').all(folderIDs);
    if (documentIDs) query.where('documents').all(documentIDs);
    if (limit) query.limit(Number(limit));
    if (skip) query.skip(Number(skip));
    query.populate('folders').populate('documents').exec((err, snippets) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(snippets);
    });
}



attachFolder = (req, res) => {
    const { id } = req.params;
    const { folderID } = req.body;
    let update = {};
    if (folderID) update.folders = ObjectId(folderID);
    Snippet.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        snippet.populate('folders').populate('documents', (err, snippet) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(snippet);
        });
    });
}

removeFolder = (req, res) => {
    const { id } = req.params;
    const { folderID } = req.body;
    let update = {};
    if (folderID) update.folders = ObjectId(folderID);
    Snippet.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        snippet.populate('folders').populate('documents', (err, snippet) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(snippet);
        });
    });
}

attachDocument = (req, res) => {
    const { id } = req.params;
    const { documentID } = req.body;
    let update = {};
    if (documentID) update.documents = ObjectId(documentID);
    Snippet.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        snippet.populate('folders').populate('documents', (err, snippet) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(snippet);
        });
    });
}

removeDocument = (req, res) => {
    const { id } = req.params;
    const { documentID } = req.body;
    let update = {};
    if (documentID) update.documents = ObjectId(documentID);
    Snippet.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        snippet.populate('folders').populate('documents', (err, snippet) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(snippet);
        });
    });
}

module.exports = { createSnippet, getSnippet, editSnippet, deleteSnippet, 
    retrieveSnippets, attachDocument, removeDocument, attachFolder, removeFolder }
