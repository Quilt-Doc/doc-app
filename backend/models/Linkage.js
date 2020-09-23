const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let linkageSchema = new Schema({
    created: {type: Date, default: Date.now },
    link: String,
    domain: String,
    title: String,
    description: String,
    references: [{type: ObjectId, ref: 'Reference'}],
    workspace: {type: ObjectId, ref: 'Workspace'},
    repository: {type: ObjectId, ref: 'Repository'},
    tags: [{type: ObjectId, ref: 'Tag'}],
    creator: {type: ObjectId, ref: 'User', required: true}
});

let Linkage = mongoose.model("Linkage", linkageSchema);

module.exports = Linkage;