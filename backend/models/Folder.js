const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

var folderSchema = new Schema({
	parent: ObjectId,
    projectID: ObjectId,
	codebase: ObjectId,
	title: String,
	description: String,
	canWrite: [{type: ObjectId, index: true}],
	canRead: [{type: ObjectId, index: true}],
	tags: [{type: ObjectId, index: true}],
	snippets: [{type: ObjectId, index: true}],
	uploadFiles: [{type: ObjectId, index: true}],
	numCodebaseSnippets: Number,
    numDocuments: Number,
    numAuthors: Number,
	created: Date
});

var Folder = mongoose.model("Folder", folderSchema);

module.exports = Folder;