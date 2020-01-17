const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let documentSchema = new Schema({
    created: Date,
    author: ObjectId,
    parents: [{type: ObjectId, index: true}],
    snippets: [{type: ObjectId, index: true}],
    title: String,
    description: String,
    uploadFiles: [{type: ObjectId, index: true}],
    tags: [{type: ObjectId, index: true}],
    canWrite: [{type: ObjectId, index: true}],
	canRead: [{type: ObjectId, index: true}]
});

let Document = mongoose.model("Document", documentSchema);

module.exports = Document;

