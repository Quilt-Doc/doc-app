const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let snippetSchema = new Schema({
    created: Date,
    docFolders: [{type: ObjectId, index: true}],
    docItems: [{type: ObjectId, index: true}],
    type: String,
    location: String, 
    status: String,
    expirationDate: Date,
});

let Snippet = mongoose.model("Snippet", snippetSchema);

module.exports = Snippet