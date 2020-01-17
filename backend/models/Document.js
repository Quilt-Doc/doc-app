const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let documentSchema = new Schema({
    created: Date,
    author: {type: ObjectId, ref: 'User'},
    parents: [{type: ObjectId, index: true, ref: 'Folder'}],
    snippets: [{type: ObjectId, index: true, ref: 'Snippet'}],
    title: String,
    description: String,
    uploadFiles: [{type: ObjectId, index: true, ref: 'UploadFile'}],
    tags: [{type: ObjectId, index: true, ref: 'Tag'}],
    canWrite: [{type: ObjectId, index: true}],
	canRead: [{type: ObjectId, index: true}]
});

let Document = mongoose.model("Document", documentSchema);

module.exports = Document;

