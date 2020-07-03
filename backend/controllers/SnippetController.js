const Snippet = require('../models/Snippet');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

locationSplit = (location) => {

    if (location[0] == '/') {
        location = location.substr(1);
    }
    
    // Precondition: location is a path in the repo containing the repo name and owner
    // Ex: kgodara/snippet-logic-test/test.py
    var locationData = location.split("/")
    // Get repo name and owner
    // Ex: kgodara/snippet-logic-test
    console.log('Received: ', location);
    var repository = locationData.shift() + "/" + locationData.shift();
    var pathInRepository = locationData.join("/");
    console.log('Repository: ', repository);
    console.log('pathinRepository: ', pathInRepository);

    return [repository, pathInRepository];
}

createSnippet = (req, res) => {
    const { annotation, code, startLine, folderIDs, documentIDs, location, type, status, name } = req.body;

    if (!typeof code == 'undefined' && ref_list !== null) return res.json({success: false, error: 'no reference ref_list provided'});
    if (!typeof annotation == 'undefined' && ref_list !== null) return res.json({success: false, error: 'no reference ref_list provided'});
    if (!typeof startLine == 'undefined' && startLine !== null) return res.json({success: false, error: 'no snippet startLine provided'});
    if (!typeof location == 'undefined' && location !== null) return res.json({success: false, error: 'no snippet location provided'});


    let snippet = new Snippet(
    {
           code,
           annotation,
           startLine
        },
    );

    var pathData = locationSplit(location);
    snippet.repository = pathData[0];
    snippet.pathInRepository = pathData[1];

    console.log(startLine)
    if (name) snippet.name = name;
    if (type) snippet.type = type;
    if (status) snippet.status = status;


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
/*
    code: [String],
    startLine: Number,
    type: String,
    pathInRepository: String,
    repository: String,
    status: String,
*/

/*
{pathInRepository: ,
    _id: ,
    startLineNum: ,
    numLines: ,
    firstLine: snippetObj.code[0], endLine: snippetObj.code[snippetObj.code.length-1]
    }
*/



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



editSnippet = (req, res) => {
    const { id } = req.params;
    const { name, location, type, status, code, startLine } = req.body;
    let update = {};
    if (name) update.name = name;
    if (location) {
        var pathData = locationSplit(location);
        update.repository = pathData[0];
        update.pathInRepository = pathData[1];
    }
    if (type) update.type = type;
    if (status) update.status = status;
    console.log("CODE", code)
    console.log("STARTLINE", startLine)
    console.log("ID", id)
    if (code) update.code = code;
    if (startLine) update.startLine = startLine;

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
    console.log('retrieveSnippets: ');
    console.log(req.body);
    let { textQuery, name, folderIDs, documentIDs, location, type, status, limit, skip } = req.body;
    query = Snippet.find();
    if (name) query.where('name').equals(location);
    console.log('retrieveSnippets location: ', location);
    if (location) {
        var pathData = locationSplit(location);
        console.log('pathData[0]: ', pathData[0]);
        console.log('pathData[1]: ', pathData[1]);
        query.where('repository').equals(pathData[0]);
        query.where({pathInRepository: { $regex: ".*" + pathData[1] + ".*"}});
    }
    if (type) query.where('type').equals(type);
    if (status) query.where('status').equals(status);
    if (folderIDs) query.where('folders').all(folderIDs);
    if (documentIDs) query.where('documents').all(documentIDs);
    if (limit) query.limit(Number(limit));
    if (skip) query.skip(Number(skip));
    console.log(query._conditions);
    console.log(query._update);
    query.populate('folders').populate('documents').exec((err, snippets) => {
        if (err) return res.json({ success: false, error: err });
        console.log('found snippets: ');
        console.log(snippets);
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
    retrieveSnippets, attachDocument, removeDocument, attachFolder, removeFolder, refreshSnippets }
