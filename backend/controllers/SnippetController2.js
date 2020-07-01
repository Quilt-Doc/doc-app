const Snippet = require('../models/Snippet');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


createSnippet = (req, res) => {
    const {  name, annotation, code, startLine, path, status, repositoryID } = req.body;

    let snippet = new Snippet( { name, annotation, code, startLine, path, status, repository: repositoryID} );

    snippet.save((err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(snippet);
    });
}

getSnippet = (req, res) => {
    Snippet.findById(req.params.id).exec((err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(snippet);
    });
}

editSnippet = (req, res) => {
    const { id } = req.params;
    const {  name, path, annotation, code, startLine,  status, repositoryID } = req.body;
    let update = {};
    if (typeof name === "string") update.name = name;
    if (typeof path === "string") update.path = path;
    if (typeof annotation === "string") update.annotation = annotation;
    if (typeof status === "string") update.status = status;
    if (code) update.code = code;
    if (startLine) update.startLine = startLine;
    if (repositoryID) update.repository = repositoryID;

    Snippet.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(snippet);
    });
}

deleteSnippet = (req, res) => {
    const { id } = req.params;
    Snippet.findByIdAndRemove(id, (err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(snippet);
    });
}

retrieveSnippets = (req, res) => {
    let { textQuery,  name, path,  status, repositoryID, limit, skip } = req.body;
    query = Snippet.find();

    if (name) query.where('name').equals(name);
    if (path) query.where('path').equals(path);
    if (status) query.where('status').equals(status);
    if (repositoryID) query.where('repository').equals(repositoryID);
    if (limit) query.limit(Number(limit));
    if (skip) query.skip(Number(skip));

    query.exec((err, snippets) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(snippets);
    });
}

module.exports = { createSnippet, getSnippet, editSnippet, deleteSnippet, retrieveSnippets }