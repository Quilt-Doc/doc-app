const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

var folderSchema = new Schema({
	parent: {type: ObjectId, ref: 'Folder'}, 
    project: {type: ObjectId, ref: 'Project'},
	codebase: {type: ObjectId, ref: 'Codebase'},
	title: String,
	creator: {type: ObjectId, index: true, ref: 'User'},
	description: String,
	canWrite: [{type: ObjectId, index: true, ref: 'User'}],
	canRead: [{type: ObjectId, index: true, ref: 'User'}],
	tags: [{type: ObjectId, index: true, ref: 'Tag'}],
	snippets: [{type: ObjectId, index: true, ref: 'Snippet'}],
	uploadFiles: [{type: ObjectId, index: true, ref: 'UploadFile'}],
	numCodebaseSnippets: Number,
    numDocuments: Number,
    numAuthors: Number,
	created: {type: Date, default: Date.now }
});

var Folder = mongoose.model("Folder", folderSchema);

module.exports = Folder;