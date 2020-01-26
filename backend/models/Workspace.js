const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

var workspaceSchema = new Schema({
	name: {type: String, required: true},
	creator: {type: ObjectId, required: true},
	memberUsers: [{type: ObjectId, required: true, index: true, ref: 'User'}],
});

var Workspace = mongoose.model("Workspace", workspaceSchema);

module.exports = Workspace;