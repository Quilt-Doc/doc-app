const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let authRequestSchema = new Schema({
    user: {type: ObjectId, ref: 'User', required: true},
    workspace: {type: ObjectId, index: true, ref: 'Workspace'},
    requestUUID: {type: String, required: true},
    // ['jira']
    platform: {type: String, required: true},
    // ['init']
    state: {type: String, required: true},
    created: {type: Date, default: Date.now }
});

let AuthRequest = mongoose.model("AuthRequest", authRequestSchema);

module.exports = AuthRequest;