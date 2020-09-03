const Tag = require('../models/Tag');
const Workspace = require('../models/Workspace');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

checkValid = (item) => {
    if (item !== null && item !== undefined) {
        return true
    }
    return false
}


createTag = async (req, res) => {
    const { label } = req.body;
    const workspaceId = req.workspaceObj._id.toString();

    let color = await Tag.count({workspace: workspaceId})

    let tag = new Tag(
        {
            label,
            workspace: ObjectId(workspaceId),
            color
        },
    );
    tag.save((err, tag) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({success: true, result: tag})
    });
}

getTag = (req, res) => {
    const tagId = req.tagObj._id.toString();

    Tag.findById(tagId).populate('folder').exec((err, tag) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({success: true, result: tag});
    });
}


editTag = (req, res) => {
    const tagId = req.tagObj._id.toString();
    const { label, color } = req.body;
    let update = {};
    if (label) update.label = label;
    if (color) update.color = color;
    Tag.findByIdAndUpdate(tagId, { $set: update }, { new: true }, (err, tag) => {
        if (err) return res.json({ success: false, error: err });
        tag.populate('folder', (err, tag) => {
            if (err) return res.json({success: false, error: err});
            return res.json({success: true, result: tag});
        });
    });
}


deleteTag = (req, res) => {
    const tagId = req.tagObj._id.toString();

    Tag.findByIdAndRemove(tagId, (err, tag) => {
        if (err) return res.json({ success: false, error: err });
        tag.populate('folder', (err, tag) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: tag});
        });
    });
}

retrieveTags = (req, res) => {

    let { search, label, color, tagIds, limit, skip } = req.body;
    let query;
    if (search) {
        query = Tag.find({label: { $regex: new RegExp(search, 'i')} })
    } else {
        query =  Tag.find();
    }

    const workspaceId = req.workspaceObj._id.toString();
    query.where('workspace').equals(workspaceId);

    if (checkValid(tagIds)) query.where('_id').in(tagIds);

    if (checkValid(label)) query.where('label').equals(label);
    if (checkValid(color)) query.where('color').equals(color);
    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));
    query.sort('-label');
    query.exec((err, tags) => {
        console.log("ENTERED HERE", err);
        if (err) return res.json({ success: false, error: err });
        if (checkValid(tagIds) && checkValid(limit)) {
            if (tags.length < limit) {
                let queryNext = Tag.find()
                queryNext.limit(Number(limit - tags.length))
                if (tagIds.length !== 0) {
                    queryNext.where('_id').nin(tagIds)
                }
                queryNext.exec((err, nextTags) => {
                    console.log("TAGS2", nextTags)
                    if (err) return res.json({ success: false, error: err });
                    tags = tags.concat(nextTags);
                })
            }
        }
        return res.json({success: true, result: tags});
    });
}



module.exports = { createTag, getTag, editTag, deleteTag, 
    retrieveTags }
