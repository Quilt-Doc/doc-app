const Snippet = require('../models/Snippet');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true
    }
    return false
}

createSnippet = async (req, res) => {
    const { annotation, code, start, 
        status, name, creatorId } = req.body;
    
    const workspaceId = req.workspaceObj._id.toString();
    const referenceId = req.referenceObj._id.toString();
    const repositoryId = req.referenceObj.repository.toString();
    
    var referenceRepository = req.referenceObj.repository;
    var workspaceRepositories = req.workspaceObj.repositories;

    // check if repositories accessible to the user workspace includes reference Repository
    if (!workspaceRepositories.includes(referenceRepository)) {
        return res.json({success: false, error: "createSnippet Error: request on repository user does not have access to."});
    }

    // verify creator matches user in req.tokenPayload
    if (checkValid(creatorId)) {
        if (req.tokenPayload.userId.toString() != creatorId) {
            return res.json({success: false, error: "createSnippet Error: JWT does not match `creator`."});
        }
    } else {
        return res.json({success: false, error: "createSnippet error: snippet creator not provided"});
    }

    // validation on essential values
    if (!checkValid(annotation)) return res.json({success: false, error: "createSnippet error: snippet annotation not provided"});
    if (!checkValid(code)) return res.json({success: false, error: "createSnippet error: snippet code not provided"});
    if (!checkValid(start)) return res.json({success: false, error: "createSnippet error: snippet start not provided"});
    if (!checkValid(status)) return res.json({success: false, error: "createSnippet error: snippet status not provided"});

    let snippet = new Snippet(
        {       
           workspace: ObjectId(workspaceId),
           reference: ObjectId(referenceId),
           repository: ObjectId(repositoryId),
           code,
           annotation,
           start,
           status,
           creator: creatorId
        },
    );

    if (name) snippet.name = name;

    // save the snippet to db
    try {
        snippet = await snippet.save();
    } catch (err) {
        return res.json({success: false, error: "createSnippet error: new snippet could not be saved", trace: err});
    }
    
    // populate certain object fields on the snippet
    try {
        snippet = await Snippet.populate(snippet, {path: "workspace reference creator"});
    } catch (err) {
        return res.json({success: false, error: "createSnippet error: new snippet could not be populated but was saved", trace: err});
    }

    return res.json({success: true, snippet});
}


getSnippet = async (req, res) => {
    const snippetId = req.snippetObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();

    let returnedSnippet;

    try {
        returnedSnippet = await Snippet.findOne({_id: snippetId, workspace: workspaceId})
            .populate({path: 'workspace reference'}).lean.exec();
    } catch (err) {
        return res.json({success: false, error: "getSnippet error: findOne query failed", trace: err});
    }

    return res.json({success: true, returnedSnippet});
}

editSnippet = async (req, res) => {
    const snippetId = req.snippetObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();
    const { name, status, code, start } = req.body;


    // build update object and selection object to update and only pull exactly what is needed from db
    let update = {};
    let selectionString = "_id";

    if (name) {
        update.name = name;
        selectionString += " name";
    }

    if (status) {
        update.status = status;
        selectionString += " status";
    }

    if (code) {
        update.code = code;
        selectionString += " code";
    }

    if (start) {
        update.start = start;
        selectionString += " start";
    }

    let returnedSnippet;
    try {
        returnedSnippet = Snippet.findOneAndUpdate({_id: snippetId, workspace: workspaceId}, 
            { $set: update }, { new: true }).select(selectionString).lean().exec();
    } catch (err) {
        return res.json({success: false, error: "editSnippet error: findOneAndUpdate query failed", trace: err});
    }
   
    return res.json({success: true, result: returnedSnippet});
}

deleteSnippet = async (req, res) => {
    const snippetId = req.snippetObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();

    let deletedSnippet;
    try {
        deletedSnippet = await Snippet.findOneAndRemove({_id: snippetId, workspace: workspaceId}).select('_id').lean().exec();
    } catch (err) {
        return res.json({success: false, error: "deleteSnippet error: findOneAndRemove query failed", trace: err});
    }
  
    return res.json({success: true, result: deletedSnippet});
}

retrieveSnippets = async (req, res) => {
    let { referenceId, repositoryId, name, status, minimal, limit, skip } = req.body;
    const workspaceId = req.workspaceObj._id.toString();

    //TODO: ADD repository: repositoryId spec
    let query = Snippet.find({ workspace: workspaceId });

    if (checkValid(referenceId)) query.where('reference').equals(referenceId)
    if (checkValid(name)) query.where('name').equals(name)
    if (checkValid(status)) query.where('status').equals(status);
    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));

    if (!minimal) {
        query.populate({path: 'workspace reference creator'});
    } else {
        query.select('_id name annotation code status start creator');
        query.populate({path: 'creator'});
    }
    
    let returnedSnippets;

    try {
        returnedSnippets = await query.lean().exec();
    } catch (err) {
        return res.json({success: false,  error: "retrieveSnippets error: find query failed", trace: err});
    }

    return res.json({success: true, result: returnedSnippets});
}


refreshSnippets = async (req, res) => {
    const workspaceId = req.workspaceObj._id.toString();
    const { updates } = req.body;
    const bulkOps = updates.map(update => ({
        updateOne: {
            filter: { _id: ObjectId(update._id), workspace: workspaceId },
            // Where field is the field you want to update
            // startLine, code, 
            update: { $set: { code: update.code, pathInRepository: update.pathInRepository, startLine: update.startLineNum } },
            upsert: true
         }
     }));

    return Snippet.collection
       .bulkWrite(bulkOps)
       .then(results => res.json({success: true, result: results}))
       .catch(err => res.json({success: false, error: `Error refreshing snippets: ${err}`}));
};


module.exports = { createSnippet, getSnippet, editSnippet, deleteSnippet, 
    retrieveSnippets, refreshSnippets }
