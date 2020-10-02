const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

var workspaceSchema = new Schema({
	name: {type: String, required: true},
	setupComplete: {type: Boolean, required: true, default: false},
	creator: {type: ObjectId, ref: 'User'},
	repositories: [{type: ObjectId, ref: 'Repository'}],
	memberUsers: [{type: ObjectId, ref: 'User'}],
});

var Workspace = mongoose.model("Workspace", workspaceSchema);

module.exports = Workspace;