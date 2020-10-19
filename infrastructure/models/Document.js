const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let documentSchema = new Schema({
    
    // Creation Date
    created: {type: Date, default: Date.now },

    // Textual Attributes
    markup: String,
    content: String,

    // Populated Model Attributes
    author: {type: ObjectId, ref: 'User'},
    references: [{type: ObjectId, ref: 'Reference'}],
    snippets: [{type: ObjectId, ref: 'Snippet'}],
    workspace: {type: ObjectId, ref: 'Workspace'},
    repository: {type: ObjectId, ref: 'Repository'},
    tags: [{type: ObjectId, ref: 'Tag'}],

    // Location Attributes
    children: [{type: ObjectId, ref:'Document'}],
    path: {type: String, default: '', index: true},
    title: {type: String, index: true},
    root: {type: Boolean, default: false},

    // Reporting Attributes

    status: {type: String, require: true, enum: ['valid', 'resolve', 'invalid'], default: 'valid'},
    breakCommit: {type: String},
    breakDate: {type: Date},

    image: String,

    attachments: [{type: String}],

    //NOT USED
    canWrite: [{type: ObjectId, ref: 'User'}],
	canRead: [{type: ObjectId, ref: 'User'}]
});

let Document = mongoose.model("Document", documentSchema);

module.exports = Document;



