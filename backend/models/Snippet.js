const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;


let snippetSchema = new Schema({
    name: {type: String, index: true},
    annotation: String,
    code: [String],
    start: Number,
    status: {type: String, enum: ['VALID', 'NEW_REGION','INVALID'], default: 'VALID'},
    workspace: {type: ObjectId, ref: 'Workspace'},
    reference: {type: ObjectId, ref: 'Reference'},
    creator: {type: ObjectId, ref: 'User'},
});

let Snippet = mongoose.model("Snippet", snippetSchema);

module.exports = Snippet