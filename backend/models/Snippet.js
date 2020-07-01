const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;


let snippetSchema = new Schema({
    name: String,
    annotation: {type: String, required: true},
    code: {type: [String], required: true},
    startLine: {type: Number, required: true},
    path: {type: String, required: true, index: true},
    status: {type: String, required: true},
    repository: {type: ObjectId, ref: 'Repository', required: true},
    creator: {type: ObjectId, ref: 'User'},
    
    // DEPRECATED 
    folders: [{type: ObjectId, index: true, ref: 'Folder'}],
    documents: [{type: ObjectId, index: true, ref: 'Document'}],
    type: String,
    pathInRepository: String,
    expirationDate: Date
});

let Snippet = mongoose.model("Snippet", snippetSchema);

module.exports = Snippet