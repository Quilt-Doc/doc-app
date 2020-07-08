const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

var workspaceSchema = new Schema({
	name: {type: String, required: true},
	creator: {type: ObjectId, required: true, ref: 'User'},
	repositories: [{type: ObjectId, required: true, index: true, ref: 'Repository'}],
	memberUsers: [{type: ObjectId, index: true, ref: 'User'}],
	icon: Number,
	key: {type: String, required: true}
});

var Workspace = mongoose.model("Workspace", workspaceSchema);

module.exports = Workspace;