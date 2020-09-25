const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

var workspaceSchema = new Schema({
	name: String,
	creator: {type: ObjectId, ref: 'User'},
	repositories: [{type: ObjectId, ref: 'Repository'}],
	memberUsers: [{type: ObjectId, ref: 'User'}],
});

var Workspace = mongoose.model("Workspace", workspaceSchema);

module.exports = Workspace;