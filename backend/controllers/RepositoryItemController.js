const RepositoryItem = require('../models/RepositoryItem');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


createRepositoryItem = (req, res) => {
    const {name, path, repositoryID, kind } = req.body;


    
    if (!typeof name == 'undefined' && name !== null) return res.json({success: false, error: 'no repository item name provided'});
    if (!typeof path == 'undefined' && path !== null) return res.json({success: false, error: 'no path name provided'});
    if (!typeof repositoryID == 'undefined' && repositoryID !== null) return res.json({success: false, error: 'repositoryID not provided'});
    if (!typeof kind == 'undefined' && kind !== null) return res.json({success: false, error: 'kind not provided'});
    
    let repositoryItem = new RepositoryItem({
        name,
        path,
        kind,
        repository: ObjectId(repositoryID),
    });

    repositoryItem.save((err, repositoryItem) => {
        if (err) return res.json({ success: false, error: err });
        repositoryItem.populate('documents').populate('repository', (err, repositoryItem) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(repositoryItem)
        });
    });
}

getRepositoryItem = (req, res) => {
    // try{req.body = JSON.parse(Object.keys(req.body)[0])}catch(err){req.body = req.body}
    const { id } = req.params;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no repository item id provided'});
    RepositoryItem.findById(id, (err, repositoryItem) => {
		if (err) return res.json({success: false, error: err});
        repositoryItem.populate('documents').populate('repository', (err, repositoryItem) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(repositoryItem);
        });
    });
}

editRepositoryItem = (req, res) => {
    const { id } = req.params;
    const {  name, path, kind } = req.body;
    let update = {};
    if (name) update.name = name;
    if (path) update.path = path;
    if (kind) update.kind = kind;
    RepositoryItem.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, repositoryItem) => {
        if (err) return res.json({ success: false, error: err });
        repositoryItem.populate('documents').populate('repository', (err, repositoryItem) => {
            if (err) return res.json(err);
            return res.json(repositoryItem);
        });
    });
}


deleteRepositoryItem = (req, res) => {
    const { id } = req.params;
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no repository item id provided'});
    RepositoryItem.findByIdAndRemove(id, (err, repositoryItem) => {
		if (err) return res.json({success: false, error: err});
        repositoryItem.populate('documents').populate('repository', (err, repositoryItem) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(repositoryItem);
        });
    });
}

retrieveRepositoryItems = (req, res) => {
    let { textQuery, name, path, repositoryID, kind, limit, skip, documentIDs } = req.body;
    query = RepositoryItem.find();
    if (kind) query.where('kind').equals(kind);
    if (name) query.where('name').equals(name);
    if (path || path === '') query.where('path').equals(path);
    if (repositoryID) query.where('repository').equals(repositoryID);
    if (documentIDs) query.where('documents').in(documentIDs);
    if (limit) query.limit(Number(limit));
    if (skip) query.skip(Number(skip));
    query.populate('documents').populate('repository').exec((err, repositoryItems) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(repositoryItems);
    });
}

attachDocument = (req, res) => {
    const { repositoryItemIDs, documentID } = req.body;
    console.log("REPITEMIDS", repositoryItemIDs)
    console.log("DOCIDS", documentID)
    let filter = { _id: { $in: repositoryItemIDs }}
    let update = {}
    if (documentID) update.documents = ObjectId(documentID);
    RepositoryItem.updateMany(filter, { $push: update }, { new: true }, (err, modified) => {
        if (err) return res.json({ success: false, error: err });
        let query =  RepositoryItem.find(filter);
        query.populate('repository').populate('documents').exec((err2, repositoryItems) => {
            if (err2) return res.json({ success: false, error: err2 });
            console.log(repositoryItems)
            return res.json(repositoryItems)
        })
    })
}

removeDocument = (req, res) => {
    const { repositoryItemIDs, documentID } = req.params;
    let filter = { _id: { $in: repositoryItemIDs }}
    let update = {}
    if (documentID) update.documents = ObjectId(documentID);
    RepositoryItem.updateMany(filter, { $pull: update }, { new: true }, (err, modified) => {
        if (err) return res.json({ success: false, error: err });
        let query =  RepositoryItem.find(filter);
        query.populate('repository').populate('documents').exec((err2, repositoryItems) => {
            if (err2) return res.json({ success: false, error: err2 });
            console.log(repositoryItems)
            return res.json(repositoryItems)
        })
    })
}

module.exports = { createRepositoryItem, getRepositoryItem,
    editRepositoryItem, deleteRepositoryItem, retrieveRepositoryItems,
    attachDocument, removeDocument
}