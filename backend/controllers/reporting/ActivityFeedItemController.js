const ActivityFeedItem = require('../../models/reporting/ActivityFeedItem');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

/*
    actionType: {type: String, enum: ["create", "delete"], required: true},
    actionDate: {type: Date, default: Date.now, required: true },
    actionUser: {type: ObjectId, ref: 'User', required: true},
    actionWorkspaceId: {type: ObjectId, ref: 'Workspace', required: true},
    actionDocumentId: {type: ObjectId, ref: 'Document'}
*/

createActivityFeedItem = (params) => {
    const { type, date, userId, 
        workspaceId, documentId } = params;

    let activityfeedItem = new ActivityFeedItem(
        {
            actionType: type,
            actionDate: date,
            actionUser: ObjectId(userId),
            actionWorkspace: ObjectId(workspaceId)
        },
    );

    if (documentId) activityfeedItem.actionDocument = documentId;

    activityfeedItem.save((err, createdObj) => {
        if (err) throw new Error("createActivityFeedItem Error: Could not save");
        return createdObj;
    });
}



retrieveActivityFeedItems = (req, res) => {
    const { limit, skip } = req.body;

    const workspaceId = req.workspaceObj._id.toString();

    let query;

    query = ActivityFeedItem.find({ actionWorkspace: workspaceId });

    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));
    
    query.sort({actionDate: -1});
    query.populate('actionUser').exec((err, items) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({success: true, result: items});
    });
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

module.exports = { createActivityFeedItem, retrieveActivityFeedItems,
                   getActivityFeedItem, deleteActivityFeedItem };
