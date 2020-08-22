/*
const Request = require('../../models/Request');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createRequest = (req, res) => {
    const { targetObjectId, type, title, description, creatorId, targetUserId } = req.body;
    let request = new Request(
        {
            title,
            targetObject: ObjectId(targetObjectId),
            creator: ObjectId(creatorId)
        },
    );
    if (type) request.type = type;
    if (targetUserId) request.targetUser = ObjectId(targetUserId)
    if (description) request.description = description;
    request.save((err, request) => {
        if (err) return res.json({ success: false, error: err });
        request.populate('creator').populate('targetObject').populate('targetUser', (err, request) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(request);
        });
    });
}


getRequest = (req, res) => {
    Request.findById(req.params.id).populate('creator').populate('targetObject')
    .populate('targetUser').exec((err, request) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(request);
    });
}



editRequest = (req, res) => {
    const { id } = req.params;
    const { targetUserId, targetObjectId, type, title, description } = req.body;
    let update = {};
    if (targetUserId) update.targetUser = ObjectId(targetUserId);
    if (targetObjectId) update.targetObject  = ObjectId(targetObjectId);
    if (type) update.type = type;
    if (title) update.title = title;
    if (description) update.description = description;
    Request.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, request) => {
        if (err) return res.json({ success: false, error: err });
        request.populate('creator').populate('targetObject')
        .populate('targetUser', (err, request) => {
            if (err) return res.json(err);
            return res.json(request);
        });
    });
}


deleteRequest = (req, res) => {
    const { id } = req.params;
    Request.findByIdAndRemove(id, (err, request) => {
        if (err) return res.json({ success: false, error: err });
        request.populate('creator').populate('targetObject')
        .populate('targetUser', (err, request) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(request);
        });
    });
}

retrieveRequests = (req, res) => {
    let { textQuery, targetObjectId, type, title, description, creatorId, targetUserId, limit, skip } = req.body;
    query = Request.find();
    if (type) query.where('type').equals(type);
    if (title) query.where('title').equals(title);
    if (description) query.where('description').equals(description);
    if (creatorId) query.where('creator').equals(creatorId);
    if (targetUserId) query.where('targetUser').equals(targetUserId);
    if (targetObjectId) query.where('targetObject').equals(targetObjectId)
    if (limit) query.limit(Number(limit));
    if (skip) query.skip(Number(skip));
    query.populate('creator').populate('targetObject')
    .populate('targetUser').exec((err, requests) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(requests);
    });
}

module.exports = { createRequest, getRequest, editRequest, deleteRequest, 
    retrieveRequests }*/