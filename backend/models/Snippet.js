const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let snippetSchema = new Schema({
    created: Date,
    creator: ObjectId,
    folders: [{type: ObjectId, index: true}],
    documents: [{type: ObjectId, index: true}],
    type: String,
    location: String, 
    status: String,
    expirationDate: Date,
});

let Snippet = mongoose.model("Snippet", snippetSchema);

module.exports = Snippet