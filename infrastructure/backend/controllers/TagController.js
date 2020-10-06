const Tag = require('../models/Tag');
const Workspace = require('../models/Workspace');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const logger = require('../logging/index').logger;

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
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                                message: `Error count query failed - workspaceId: ${workspaceId}`,
                                function: 'createTag'});
        return res.json({success: true, error: 'Error count query failed'});
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
        await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error saving tag - workspaceId: ${workspaceId}`,
                                function: 'createTag'});
        return res.json({success: false, error: "createTag Error: save query failed", trace: err});
    }

    await logger.info({source: 'backend-api',
                        message: `Successfully created tag - tagId, workspaceId, label: ${tag._id.toString()}, ${workspaceId}, ${label}`,
                        function: 'createTag'});
    return res.json({success: true, result: tag});
}

getTag = async (req, res) => {
    const tagId = req.tagObj._id.toString();
    
    let returnedTag;
    const workspaceId = req.workspaceObj._id;

    try {
        returnedTag = await Tag.findOne({_id: tagId, workspace: workspaceId}).lean().exec();
    } catch (err) {
        await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error findOne query failed - tagId, workspaceId: ${tagId}, ${workspaceId}`,
                                function: 'getTag'});
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
        await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error findByIdAndUpdate query failed - tagId, update: ${tagId}, ${JSON.stringify(update)}`,
                                function: 'editTag'});
        return res.json({success: false, error: "editTag Error: findByIdAndUpdate query failed", trace: err});
    }
    
    await logger.info({source: 'backend-api',
                            message: `Successfully edited tag - tagId, update: ${tagId}, ${JSON.stringify(update)}`,
                            function: 'editTag'});
    return res.json({success:true, result: returnedTag});
}


deleteTag = async (req, res) => {
    const tagId = req.tagObj._id.toString();

    let deletedTag;

    try {
        deletedTag = await Tag.findByIdAndRemove(tagId).select('_id').lean().exec();
    } catch (err) {
        await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error findByIdAndRemove query failed - tagId: ${tagId}`,
                                function: 'deleteTag'});
        return res.json({success: false, error: "deleteTag Error: findByIdAndRemove query failed", trace: err});
    }
    
    await logger.info({source: 'backend-api',
                        message: `Successfully deleted tag - tagId: ${tagId}`,
                        function: 'deleteTag'});

    return res.json({success:true, result: deletedTag});
}

retrieveTags = async (req, res) => {

    let { label, color, tagIds, limit, skip } = req.body;
    const workspaceId = req.workspaceObj._id.toString();

    let query = Tag.find({workspace: workspaceId});
    
    if (checkValid(tagIds)) query.where('_id').in(tagIds);
    if (checkValid(label)) query.where('label').equals(label);
    if (checkValid(color)) query.where('color').equals(color);
    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));

    // KARAN TODO: Does this dash have a purpose?
    query.sort('-label');

    let returnedTags;
    try {
        returnedTags = await query.lean().exec();
    } catch (err) {
        await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error find query failed - workspaceId, tagIds, label, color: ${workspaceId}, ${JSON.stringify(tagIds)}, ${label}, ${color}`,
                                function: 'retrieveTags'});

        return res.json({success: false, error: "retrieveTags Error: find query failed", trace: err});
    }

    await logger.info({source: 'backend-api',
        message: `Successfully retrieve ${returnedTags.length} tags - workspaceId: ${workspaceId}`,
        function: 'retrieveTags'});

    return res.json({success: true, result: returnedTags});
}



module.exports = { createTag, getTag, editTag, deleteTag, 
    retrieveTags }
