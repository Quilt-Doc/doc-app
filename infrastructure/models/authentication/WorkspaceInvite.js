// var rootReq = require.bind( require.main );

const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let workspaceInviteSchema = new Schema({
    workspace: {type: ObjectId, ref: 'Workspace'},
    invitedEmail: {type: String, required: true},
    created: {type: Date, default: Date.now },
});

let WorkspaceInvite = mongoose.model("WorkspaceInvite", workspaceInviteSchema);

module.exports = WorkspaceInvite;