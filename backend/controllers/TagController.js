const Tag = require('../models/Tag');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createTag = (req, res) => {
    const { label, color } = req.body;
    let tag = new Tag(
        {
            label,
            color
        },
    );
    tag.save((err, tag) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(tag)
    });
}

getTag = (req, res) => {
    Tag.findById(req.params.id).populate('folder').exec((err, tag) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(tag);
    });
}



editTag = (req, res) => {
    const { id } = req.params;
    const { label, color } = req.body;
    let update = {};
    if (label) update.label = label;
    if (color) update.color = color;
    Tag.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, tag) => {
        if (err) return res.json({ success: false, error: err });
        tag.populate('folder', (err, tag) => {
            if (err) return res.json(err);
            return res.json(tag);
        });
    });
}


deleteTag = (req, res) => {
    const { id } = req.params;
    Tag.findByIdAndRemove(id, (err, tag) => {
        if (err) return res.json({ success: false, error: err });
        tag.populate('folder', (err, tag) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(tag);
        });
    });
}

retrieveTags = (req, res) => {
    let { search, label, color, limit, skip } = req.body;
    let query;
    if (search) {
        query = Tag.find({label: { $regex: new RegExp(search, 'i')} })
    } else {
        query =  Tag.find();
    }

    if (label) query.where('label').equals(label);
    if (color) query.where('color').equals(color);
    if (limit) query.limit(Number(limit));
    if (skip) query.skip(Number(skip));
    query.exec((err, tags) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(tags);
    });
}



module.exports = { createTag, getTag, editTag, deleteTag, 
    retrieveTags }
