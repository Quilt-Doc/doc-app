const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

var projectSchema = new Schema({
	name: String,
	creator: {type: ObjectId, ref: 'User', index: true},
	users: [{type: ObjectId, ref: 'User', index: true}],
	codebases: [{type: ObjectId, index: true, ref: 'Codebase'}],
	description: String,
	created: {type: Date, default: Date.now}
});

var Project = mongoose.model("Project", projectSchema);

module.exports = Project;