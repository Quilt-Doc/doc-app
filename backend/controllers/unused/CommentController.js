/*
const Comment = require('../../models/unused/Comment');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createComment = (req, res) => {
    const { creatorId, text, type, targetObjectId} = req.body;
    let comment = new Comment(
        {
            type,
            targetObject: ObjectId(targetObjectId),
            creator: ObjectId(creatorId),
            text: text
        },
    );
    comment.save((err, comment) => {
        if (err) return res.json({ success: false, error: err });
        comment.populate('creator', (err, comment) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(comment);
        });
    });
}

getComment = (req, res) => {
    Comment.findById(req.params.id).populate('creator').exec((err, comment) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(comment);
    });
}



editComment = (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    let update = {};
    if (text) update.text = text;
    Comment.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, comment) => {
        if (err) return res.json({ success: false, error: err });
        comment.populate('creator', (err, comment) => {
            if (err) return res.json(err);
            return res.json(comment);
        });
    });
}


deleteComment = (req, res) => {
    const { id } = req.params;
    Comment.findByIdAndRemove(id, (err, comment) => {
        if (err) return res.json({ success: false, error: err });
        comment.populate('creator', (err, comment) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(comment);
        });
    });
}

retrieveComments = (req, res) => {
    let { creatorId, text, type, targetObjectId, limit, skip } = req.body;
    query = Comment.find();
    if (creatorId) query.where('creator').equals(creatorId);
    if (text) query.where('text').equals(text);
    if (type) query.where('type').equals(type);
    if (targetObjectId) query.where('targetObject').equals(targetObjectId)
    if (limit) query.limit(Number(limit));
    if (skip) query.skip(Number(skip));
    query.populate('creator').exec((err, comments) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(comments);
    });
}



module.exports = { createComment, getComment, editComment, deleteComment, 
    retrieveComments }
*/