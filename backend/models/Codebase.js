const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

var codebaseSchema = new Schema({
	workspaceID: Date,
	name: {type: String, index: true},
	project: ObjectId,
	numPosts: Number,
	numReqs: Number,
	url: String,
	color: String
});

var Codebase = mongoose.model("Codebase", codebaseSchema);

module.exports = Codebase;
