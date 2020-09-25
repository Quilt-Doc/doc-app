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

    if (!checkValid(label)) return res.json({success: false, error: "createTag Error: label not provided"});
    let color;
    
    try {
        color = await Tag.count({workspace: workspaceId}).exec();
    } catch (err) {
        return res.json({success: true, result: returnedSnippets});
    }

    let tag = new Tag(
        {
            label,
            workspace: ObjectId(workspaceId),
            color
        },
    );

    try {
        tag = await tag.save();
    } catch (err) {
        return res.json({success: false, error: "createTag Error: save query failed", trace: err});
    }

    return res.json({success: true, result: tag});
}

getTag = async (req, res) => {
    const tagId = req.tagObj._id.toString();
    
    let returnedTag;
    const workspaceId = req.workspaceObj._id;

    try {
        returnedTag = await Tag.findOne({_id: tagId, workspace: workspaceId}).lean().exec();
    } catch (err) {
        return res.json({success: false, error: "getTag Error: findById query failed", trace: err});
    }

    return res.json({success:true, result: returnedTag});
}

editTag = async (req, res) => {
    const tagId = req.tagObj._id.toString();
    const { label, color } = req.body;

    let update = {};
    if (label) update.label = label;
    if (color) update.color = color;

    let returnedTag;
    try {
        returnedTag = await Tag.findByIdAndUpdate(tagId, { $set: update }, { new: true }).lean().exec();
    } catch (err) {
        return res.json({success: false, error: "editTag Error: findByIdAndUpdate query failed", trace: err});
    }
    
    return res.json({success:true, result: returnedTag});
}


deleteTag = async (req, res) => {
    const tagId = req.tagObj._id.toString();

    let deletedTag;

    try {
        deletedTag = await Tag.findByIdAndRemove(tagId).select('_id').lean().exec();
    } catch (err) {
        return res.json({success: false, error: "deleteTag Error: findByIdAndRemove query failed", trace: err});
    }
   
    return res.json({success:true, result: deletedTag});
}

retrieveTags = async (req, res) => {

    let { search, label, color, tagIds, limit, skip } = req.body;
    const workspaceId = req.workspaceObj._id.toString();

    let query;
    if (search) {
        query = Tag.find({workspace: workspaceId, label: { $regex: new RegExp(search, 'i')} })
    } else {
        query =  Tag.find({workspace: workspaceId});
    }
   
    if (checkValid(tagIds)) query.where('_id').in(tagIds);
    if (checkValid(label)) query.where('label').equals(label);
    if (checkValid(color)) query.where('color').equals(color);
    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));
    query.sort('-label');

    let returnedTags;
    try {
        returnedTags = await query.lean.exec();
    } catch (err) {
        return res.json({success: false, error: "retrieveTags Error: find query failed", trace: err});
    }

    if (checkValid(tagIds) && checkValid(limit) && returnedTags.length < limit) {
        query = Tag.find();
        query.limit(Number(limit - returnedTags.length));
        query.where('_id').nin(tagIds)

        let moreTags;
        
        try {
            moreTags = query.lean().exec();
        } catch (err) {
            return res.json({success: false, error: "retrieveTags Error: find more with limit query failed", trace: err});
        }

        returnedTags = [...returnedTags, ...moreTags];
    }

    return res.json({success: true, result: returnedTags});
}



module.exports = { createTag, getTag, editTag, deleteTag, 
    retrieveTags }
