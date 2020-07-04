const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

var referenceSchema = new Schema({
	name: String,
	kind: String,
	path: String,
	lineNum: Number,
	repository: {type: ObjectId, ref: 'Repository'},
	created: {type: Date, default: Date.now }
});

var Reference = mongoose.model("Reference", referenceSchema);

module.exports = Reference;
