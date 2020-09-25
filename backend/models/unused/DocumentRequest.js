const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;


var documentRequestSchema = new Schema({
    created: {type: Date, default: Date.now },
    author: {type: ObjectId, ref: 'User', required: true},
    title: String, 
    markup: String,
    status: {type: String, required: true},
    references: [{type: ObjectId, ref: 'Reference'}],
    snippets: [{type: ObjectId, ref: 'Snippet'}],
    workspace: {type: ObjectId, ref: 'Workspace'},
    repository: {type: ObjectId, ref: 'Repository'},
    tags: [{type: ObjectId, ref: 'Tag'}],
    mentions: [{type: ObjectId, ref: 'User'}]

});

var DocumentRequest = mongoose.model("DocumentRequest", documentRequestSchema);

module.exports = DocumentRequest;