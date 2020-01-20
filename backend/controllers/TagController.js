const Tag = require('../models/Tag');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createTag = (req, res) => {
    const { title, color, projectID } = req.body;
    let tag = new Tag(
        {
            title,
            color,
            project: ObjectId(projectID),
            created: new Date(),
        },
    );
    tag.save((err, tag) => {
        if (err) return res.json({ success: false, error: err });
        tag.populate('project', (err, tag) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(tag);
        });
    });
}

getTag = (req, res) => {
    Tag.findById(req.params.id).populate('project').exec((err, tag) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(tag);
    });
}



editTag = (req, res) => {
    const { id } = req.params;
    const { title, color } = req.body;
    let update = {};
    if (title) update.title = title;
    if (color) update.color = color;
    Tag.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, tag) => {
        if (err) return res.json({ success: false, error: err });
        tag.populate('project', (err, tag) => {
            if (err) return res.json(err);
            return res.json(tag);
        });
    });
}


deleteTag = (req, res) => {
    const { id } = req.params;
    Tag.findByIdAndRemove(id, (err, tag) => {
        if (err) return res.json({ success: false, error: err });
        tag.populate('project', (err, tag) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(tag);
        });
    });
}

retrieveTags = (req, res) => {
    let { textQuery, title, color, projectID, limit, skip } = req.body;
    query = Tag.find();
    if (title) query.where('title').equals(title);
    if (color) query.where('color').equals(color);
    if (projectID) query.where('projectID').equals(projectID);
    if (limit) query.limit(Number(limit));
    if (skip) query.skip(Number(skip));
    query.populate('project').exec((err, tags) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(tags);
    });
}



module.exports = { createTag, getTag, editTag, deleteTag, 
    retrieveTags }
