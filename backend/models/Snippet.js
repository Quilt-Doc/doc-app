const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;


let snippetSchema = new Schema({
    name: String,
    annotation: {type: String, required: true},
    code: {type: [String], required: true},
    start: {type: Number, required: true},
    status: {type: String, required: true},
    workspace: {type: ObjectId, ref: 'Workspace'},
    reference: {type: ObjectId, ref: 'Reference', required: true},
    creator: {type: ObjectId, ref: 'User', required: true},
    
    // DEPRECATED 
    startLine: {type: Number},
    repository: {type: ObjectId, ref: 'Repository'},
    path: {type: String },
    folders: [{type: ObjectId, index: true, ref: 'Folder'}],
    documents: [{type: ObjectId, index: true, ref: 'Document'}],
    type: String,
    pathInRepository: String,
    expirationDate: Date
});

let Snippet = mongoose.model("Snippet", snippetSchema);

module.exports = Snippet