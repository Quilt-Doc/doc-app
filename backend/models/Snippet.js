const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let snippetSchema = new Schema({
    created: {type: Date, default: Date.now },
    name: String,
<<<<<<< HEAD
    annotation: String,
    code: [String],
    start_line: Number,
=======
>>>>>>> 517255baf348e7741f9e5e4a3e4876e2ffbdae0f
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