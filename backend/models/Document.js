const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let documentSchema = new Schema({
    created: {type: Date, default: Date.now },
    author: {type: ObjectId, ref: 'User', required: true},
    title: String,
    markup: String,
    references: [{type: ObjectId, ref: 'Reference'}],
    workspace: {type: ObjectId, ref: 'Workspace'},
    repository: {type: ObjectId, ref: 'Repository'},
    children: [{type: ObjectId, ref:'Document'}],
    root: {type: Boolean, default: false},
    tags: [{type: ObjectId, ref: 'Tag'}],
    parent: {type: ObjectId, ref: 'Document'},
    path: {type: String, default: ''},
    order: Number,

    // Reporting Attributes

    status: {type: String, require: true, enum: ['valid', 'resolve', 'invalid'], default: 'valid'},
    breakCommit: {type: String},
    breakDate: {type: Date},

    //NOT USED
    uploadFiles: [{type: ObjectId, ref: 'UploadFile'}],
    canWrite: [{type: ObjectId, ref: 'User'}],
	canRead: [{type: ObjectId, ref: 'User'}]
});

let Document = mongoose.model("Document", documentSchema);

module.exports = Document;



