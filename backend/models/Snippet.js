const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let snippetSchema = new Schema({
    created: Date,
    creator: {type: ObjectId, ref: 'User'},
    folders: [{type: ObjectId, index: true, ref: 'Folder'}],
    documents: [{type: ObjectId, index: true, ref: 'Document'}],
    type: String,
    location: String, 
    status: String,
    expirationDate: Date,
});

let Snippet = mongoose.model("Snippet", snippetSchema);

module.exports = Snippet