const Workspace = require("../models/Workspace");
const Reference = require("../models/Reference");
const Document = require("../models/Document");
const Tag = require("../models/Tag");
const Snippet = require("../models/Snippet");
const Repository = require("../models/Repository");
const User = require("../models/authentication/User");
var mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const workspaceIdParam = async (req, res, next, workspaceId) => {
    // console.log('workspaceParamMiddleware called!');

    if (req.workspaceObj) {
        next();
    }
    // try to get the workspace object and attach it to the request object

    try {
        // console.log(`Trying to find Workspace - workspaceId: ${workspaceId}`);
        var foundWorkspace = await Workspace.findById(ObjectId(workspaceId))
            .lean()
            .exec();
        if (!foundWorkspace || foundWorkspace == null) {
            next(
                new Error(
                    `workspaceIdParam, workspace with workspaceId doesn't exist - workspaceId: ${workspaceId}`
                )
            );
        }

        // console.log("Found Workspace: ");
        // console.log(foundWorkspace);
        req.workspaceObj = foundWorkspace;
        // console.log(`workspaceParamMiddleware setting workspaceObj to foundWorkspace: ${JSON.stringify(foundWorkspace)}`);
    } catch (err) {
        next(err);
    }
    next();
};

const referenceIdParam = async (req, res, next, referenceId) => {
    if (req.referenceObj) {
        next();
    }
    // try to get the reference object and attach it to the request object
    try {
        var foundReference = await Reference.findById(referenceId)
            .lean()
            .exec();
        if (!foundReference) {
            next(new Error("referenceIdParam: referenceId doesn't exist"));
        }
        req.referenceObj = foundReference;
    } catch (err) {
        next(err);
    }
    next();
};

const documentIdParam = async (req, res, next, documentId) => {
    if (req.documentObj) {
        next();
    }

    // console.log(`Searching for documentId: ${documentId}`);

    // try to get the reference object and attach it to the request object
    try {
        var foundDocument = await Document.findById(documentId).lean().exec();
        if (!foundDocument) {
            next(new Error("documentIdParam: documentId doesn't exist"));
        }
        req.documentObj = foundDocument;
    } catch (err) {
        next(err);
    }
    next();
};

const tagIdParam = async (req, res, next, tagId) => {
    if (req.tagObj) {
        next();
    }
    // try to get the reference object and attach it to the request object
    try {
        var foundTag = await Tag.findById(tagId).lean().exec();
        if (!foundTag) {
            next(new Error("tagIdParam: tagId doesn't exist"));
        }
        req.tagObj = foundTag;
    } catch (err) {
        next(err);
    }
    next();
};

const snippetIdParam = async (req, res, next, snippetId) => {
    if (req.snippetObj) {
        next();
    }
    // try to get the reference object and attach it to the request object
    try {
        var foundSnippet = await Snippet.findById(snippetId).lean().exec();
        if (!foundSnippet) {
            next(new Error("snippetIdParam: snippetId doesn't exist"));
        }
        req.snippetObj = foundSnippet;
    } catch (err) {
        next(err);
    }
    next();
};

const repositoryIdParam = async (req, res, next, repositoryId) => {
    if (req.repositoryObj) {
        next();
    }
    // try to get the reference object and attach it to the request object
    try {
        var foundRepository = await Repository.findById(repositoryId)
            .lean()
            .exec();
        if (!foundRepository) {
            next(new Error("repositoryIdParam: repositoryId doesn't exist"));
        }
        req.repositoryObj = foundRepository;
    } catch (err) {
        next(err);
    }
    next();
};

const userIdParam = async (req, res, next, userId) => {
    if (req.userObj) {
        next();
    }
    // try to get the reference object and attach it to the request object
    try {
        var foundUser = await User.findById(userId).lean().exec();
        if (!foundUser) {
            next(new Error("userIdParam: userId doesn't exist"));
        }
        req.userObj = foundUser;
    } catch (err) {
        next(err);
    }
    next();
};

module.exports = {
    workspaceIdParam,
    referenceIdParam,
    documentIdParam,
    tagIdParam,
    snippetIdParam,
    repositoryIdParam,
    userIdParam,
};
