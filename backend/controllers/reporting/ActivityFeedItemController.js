const ActivityFeedItem = require('../../models/reporting/ActivityFeedItem');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const logger = require('../../logging/index').logger;

/*
    type: {type: String, enum: ["create", "delete"], required: true},
    date: {type: Date, default: Date.now, required: true },
    user: {type: ObjectId, ref: 'User', required: true},
    workspace: {type: ObjectId, ref: 'Workspace', required: true},
    document: {type: ObjectId, ref: 'Document'}
*/

createActivityFeedItem = async (params) => {
    const { type, date, userId, 
        workspaceId, userUpdates } = params;

    var activityfeedItemList = [];

    userUpdates.forEach(userUpdate => {
        var activityFeedItem = {type: type,
                                date: date,
                                user: ObjectId(userId),
                                workspace: ObjectId(workspaceId)
                            }
        if (userUpdate.documentId) activityFeedItem.document = userUpdate.documentId;
        if (userUpdate.title) activityFeedItem.title = userUpdate.title;

        activityfeedItemList.push(activityFeedItem);
    });

    try {
        var bulkInsertResult = await ActivityFeedItem.insertMany(activityfeedItemList);
        return bulkInsertResult;
    }
    catch (err) {
        logger.error({source: 'backend-api', message: err,
                        errorDescription: `Error saving new ActivityFeedItem(s) workspaceId, userId, userUpdates: ${workspaceId}, ${userId}, ${JSON.stringify(userUpdates)}`,
                        function: 'createActivityFeedItem'});
        throw new Error(`Error saving new ActivityFeedItem(s) workspaceId, userId, userUpdates: ${workspaceId}, ${userId}, ${JSON.stringify(userUpdates)}`);
    }
}



retrieveActivityFeedItems = async (req, res) => {
    const { limit, skip } = req.body;

    const workspaceId = req.workspaceObj._id.toString();

    let query;

    query = ActivityFeedItem.find({ workspace: workspaceId });

    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));
    
    query.sort({date: -1});
    query.populate('user');
    var items;
    try {
        items = await query.exec();
        return res.json({success: true, result: items});
    }
    catch (err) {
        logger.error({source: 'backend-api', message: err,
                        errorDescription: 'Error retrieving ActivityFeedItems', function: 'retrieveActivityFeedItems'});
        return res.json({success: false, error: err});
    }
}

/*
getActivityFeedItem = (req, res) => {
    const snippetId = req.snippetObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();
    const { name, status, code, start} = req.body;

    let update = {};
    if (name) update.name = name;
    if (status) update.status = status;
    if (code) update.code = code;
    if (start) update.start = start;

    Snippet.findOneAndUpdate({_id: snippetId, workspace: workspaceId}, { $set: update }, { new: true }, (err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        snippet.populate('workspace').populate('reference', (err, snippet) => {
            if (err) return res.json({success: false, error: err});
            return res.json({success: true, result: snippet});
        });
    });
}

deleteActivityFeedItem = (req, res) => {
    const snippetId = req.snippetObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();
    Snippet.findOneAndRemove({_id: snippetId, workspace: workspaceId}, (err, snippet) => {
        if (err) return res.json({ success: false, error: err });
        snippet.populate('workspace').populate('reference', (err, snippet) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: snippet});
        });
    });
}*/

module.exports = { createActivityFeedItem, retrieveActivityFeedItems };
