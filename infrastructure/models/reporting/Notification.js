const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let notificationSchema = new Schema({
    type: {type: String, enum: ['invalid_knowledge', 'to_document', 'added_workspace', 'removed_workspace'], required: true},
    user: {type: ObjectId, ref: 'User', required: true},
    workspace: {type: ObjectId, ref: 'Workspace'},
    repository: {type: ObjectId, ref: 'Repository'},
    check: {type: ObjectId, ref: 'Check'},
    
    status: {type: String, enum: ['visible', 'hidden'], default: 'visible'},

    created: {type: Date, default: Date.now },
});

let Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;