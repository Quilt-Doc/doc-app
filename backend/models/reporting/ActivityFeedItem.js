const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let activityFeedItemSchema = new Schema({
    actionType: {type: String, enum: ["create", "delete"], required: true},
    actionDate: {type: Date, default: Date.now, required: true },
    actionUser: {type: ObjectId, ref: 'User', required: true},
    actionWorkspace: {type: ObjectId, ref: 'Workspace', required: true},
    actionDocument: {type: ObjectId, ref: 'Document'}
});

let ActivityFeedItem = mongoose.model("ActivityFeedItem", activityFeedItemSchema);

module.exports = ActivityFeedItem;