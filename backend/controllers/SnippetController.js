const Snippet = require('../models/Snippet');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


createSnippet = (req, res) => {
    console.log("ENTERED")
    const { annotation, code, start, 
        workspaceId, referenceId, status, name, creator } = req.body;
    
    console.log("ANNO", annotation)
    console.log("CODE", code)
    console.log("START", start)
    console.log("WORKSPACE", workspaceId)
    console.log("REFId", referenceId)
    console.log("STATUS", status)
    console.log("NAME", name)
    console.log("CREATOR", creator)
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
    Snippet.findById(req.params.id).populate('workspace').populate('reference').exec((err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(snippet);
    });
}

editSnippet = (req, res) => {
    const { id } = req.params;
    const { name, status, code, start} = req.body;
    
    let update = {};
    if (name) update.name = name;
    if (status) update.status = status;
    if (code) update.code = code;
    if (start) update.start = start;

    Snippet.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        snippet.populate('workspace').populate('reference', (err, snippet) => {
            if (err) return res.json(err);
            return res.json(snippet);
        });
    });
}

deleteSnippet = (req, res) => {
    const { id } = req.params;
    Snippet.findByIdAndRemove(id, (err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        snippet.populate('workspace').populate('reference', (err, snippet) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(snippet);
        });
    });
}

retrieveSnippets = (req, res) => {
    let { referenceId, workspaceId, name, status, limit, skip } = req.body;
    query = Snippet.find();

    if (workspaceId) query.where('workspace').equals(workspaceId)
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
    const { updates } = req.body;
    const bulkOps = updates.map(update => ({
        updateOne: {
            filter: { _id: ObjectId(update._id) },
            // Where field is the field you want to update
            // startLine, code, 
            update: { $set: { code: update.code, pathInRepository: update.pathInRepository, startLine: update.startLineNum } },
            upsert: true
         }
     }));
   // where Model is the name of your model
   return Snippet.collection
       .bulkWrite(bulkOps)
       .then(results => res.json(results))
       .catch(err => console.log('Error refreshing snippets: ', err));
};


module.exports = { createSnippet, getSnippet, editSnippet, deleteSnippet, 
    retrieveSnippets, refreshSnippets }
