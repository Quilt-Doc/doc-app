const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

var folderSchema = new Schema({
	parent: {type: ObjectId, ref: 'Folder'}, 
    projectID: ObjectId,
	codebase: {type: ObjectId, ref: 'Codebase'},
	title: String,
	description: String,
	canWrite: [{type: ObjectId, index: true}],
	canRead: [{type: ObjectId, index: true}],
	tags: [{type: ObjectId, index: true, ref: 'Tag'}],
	snippets: [{type: ObjectId, index: true, ref: 'Snippet'}],
	uploadFiles: [{type: ObjectId, index: true, ref: 'UploadFile'}],
	numCodebaseSnippets: Number,
    numDocuments: Number,
    numAuthors: Number,
	created: Date
});

var Folder = mongoose.model("Folder", folderSchema);

module.exports = Folder;