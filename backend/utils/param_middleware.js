const Workspace = require('../models/Workspace');
const Reference = require('../models/Reference');
const Document = require('../models/Document');
const Tag = require('../models/Document');

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


const workspaceIdParam = async (req, res, next, workspaceId) => {
    if (req.workspaceObj) {
        next();
    }
    // try to get the workspace object and attach it to the request object
    try {
        var foundWorkspace = await Workspace.findById(workspaceId);
        if (!foundWorkspace) {
            next(new Error("workspaceIdParam: workspaceId doesn't exist"));
        }
        req.workspaceObj = foundWorkspace;
    }
    catch(err) {
        next(err);
    }
    next();
}

const referenceIdParam = async (req, res, next, referenceId) => {
    if (req.referenceObj) {
        next();
    }
    // try to get the reference object and attach it to the request object
    try {
        var foundReference = await Reference.findById(referenceId);
        if (!foundReference) {
            next(new Error("referenceIdParam: referenceId doesn't exist"));
        }
        req.referenceObj = foundReference;
    }
    catch(err) {
        next(err);
    }
    next();
}

const documentIdParam = async (req, res, next, documentId) => {
    if (req.documentObj) {
        next();
    }
    // try to get the reference object and attach it to the request object
    try {
        var foundDocument = await Document.findById(documentId);
        if (!foundDocument) {
            next(new Error("documentIdParam: documentId doesn't exist"));
        }
        req.documentObj = foundDocument;
    }
    catch(err) {
        next(err);
    }
    next();
}

const tagIdParam = async (req, res, next, tagId) => {
    if (req.tagObj) {
        next();
    }
    // try to get the reference object and attach it to the request object
    try {
        var foundTag = await Tag.findById(tagId);
        if (!foundTag) {
            next(new Error("tagIdParam: tagId doesn't exist"));
        }
        req.tagObj = foundTag;
    }
    catch(err) {
        next(err);
    }
    next();
}

const snippetIdParam = async (req, res, next, snippetId) => {
    if (req.snippetObj) {
        next();
    }
    // try to get the reference object and attach it to the request object
    try {
        var foundSnippet = await Tag.findById(snippetId);
        if (!foundSnippet) {
            next(new Error("snippetIdParam: snippetId doesn't exist"));
        }
        req.snippetObj = foundSnippet;
    }
    catch(err) {
        next(err);
    }
    next();
}




module.exports = {
    workspaceIdParam,
    referenceIdParam,
    documentIdParam,
    tagIdParam,
    snippetIdParam
}