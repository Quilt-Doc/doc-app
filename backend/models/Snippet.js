const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;


let snippetSchema = new Schema({
    name: String,
    annotation: {type: String, required: true},
    code: {type: [String], required: true},
    start: {type: Number, required: true},
    status: {type: String, required: true, enum: ['VALID', 'NEW_REGION','INVALID'], default: 'VALID'},
    workspace: {type: ObjectId, ref: 'Workspace', required: true},
    reference: {type: ObjectId, ref: 'Reference', required: true},
    creator: {type: ObjectId, ref: 'User', required: true},
    repository: {type: ObjectId, ref: 'Repository', required: true},
});

let Snippet = mongoose.model("Snippet", snippetSchema);

module.exports = Snippet