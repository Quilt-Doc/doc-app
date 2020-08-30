const Snippet = require('../models/Snippet');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


createSnippet = (req, res) => {
    const { annotation, code, start, 
        status, name, creator } = req.body;
    
    const workspaceId = req.workspaceObj._id.toString();
    const referenceId = req.referenceObj._id.toString();
    
    var referenceRepository = req.referenceObj.repository.toString();
    var workspaceRepositories = req.workspaceObj.repositories.map(repositoryObj => {repositoryObj.toString()});

    if (workspaceRepositories.indexOf(referenceRepository) == -1) {
        return res.json({success: false, error: "createSnippet Error: request on repository user does not have access to."});
    }

    // DONE: Verify creator matches user in req.tokenPayload
    if (creator) {
        if (req.tokenPayload.userId.toString() != creator) {
            return res.json({success: false, error: "createSnippet Error: JWT does not match `creator`."});
        }
    }


    let snippet = new Snippet(
        {       
           workspace: ObjectId(workspaceId),
           reference: ObjectId(referenceId),
           code,
           annotation,
           start,
           status,
           
        },
    );

    if (creator) snippet.creator = creator

    if (name) snippet.name = name;

    snippet.save((err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        snippet.populate('workspace').populate('reference', (err, snippet) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(snippet);
        });
    });
}


getSnippet = (req, res) => {
    const snippetId = req.snippetObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();
    Snippet.findOne({_id: snippetId, workspace: workspaceId}).populate('workspace').populate('reference').exec((err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(snippet);
    });
}

editSnippet = (req, res) => {
    const snippetId = req.snippetObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();
    const { name, status, code, start} = req.body;
    
    let update = {};
    if (name) update.name = name;
    if (status) update.status = status;
    if (code) update.code = code;
    if (start) update.start = start;

    Snippet.findOneAndUpdate({_id: snippetId, workspace: workspaceId}, { $set: update }, { new: true }, (err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        snippet.populate('workspace').populate('reference', (err, snippet) => {
            if (err) return res.json(err);
            return res.json(snippet);
        });
    });
}

deleteSnippet = (req, res) => {
    const snippetId = req.snippetObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();
    Snippet.findOneAndRemove({_id: snippetId, workspace: workspaceId}, (err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        snippet.populate('workspace').populate('reference', (err, snippet) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(snippet);
        });
    });
}

retrieveSnippets = (req, res) => {
    let { referenceId, name, status, limit, skip } = req.body;
    const workspaceId = req.workspaceObj._id.toString();
    query = Snippet.find();

    query.where('workspace').equals(workspaceId)

    if (referenceId) query.where('reference').equals(referenceId)
    if (name) query.where('name').equals(name)
    if (status) query.where('status').equals(status);
    if (limit) query.limit(Number(limit));
    if (skip) query.skip(Number(skip));

    query.populate('workspace').populate('reference').exec((err, snippets) => {
        if (err) return res.json({ success: false, error: err });
        console.log("SNIPPETS", snippets)
        return res.json(snippets);
    });
}


refreshSnippets = (req, res) => {
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
       .then(results => res.json(results))
       .catch(err => console.log('Error refreshing snippets: ', err));
};


module.exports = { createSnippet, getSnippet, editSnippet, deleteSnippet, 
    retrieveSnippets, refreshSnippets }
