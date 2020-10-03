const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let activityFeedItemSchema = new Schema({
    type: {type: String, enum: ["create", "delete"], required: true},
    date: {type: Date, default: Date.now, required: true },
    user: {type: ObjectId, ref: 'User', required: true},
    workspace: {type: ObjectId, ref: 'Workspace', required: true},
    document: {type: ObjectId, ref: 'Document'},
    title: {type: String}
});

let ActivityFeedItem = mongoose.model("ActivityFeedItem", activityFeedItemSchema);

module.exports = ActivityFeedItem;