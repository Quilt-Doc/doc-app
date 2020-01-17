const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

var projectSchema = new Schema({
	name: String,
	author: ObjectId,
	userIDs: [{type: ObjectId, index: true}],
	codebases: [{type: ObjectId, index: true, ref: 'Codebase'}],
	description: String,
	created: Date
});

var Project = mongoose.model("Project", projectSchema);

module.exports = Project;