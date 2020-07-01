const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

var referenceSchema = new Schema({
	name: {type: String, index: true, required: true},
	kind: {type: String, index: true, required: true},
	path: {type: String, index: true, required: true},
	description: {type: String},
	lineNum: Number,
	offset: Number,
	created: {type: Date, default: Date.now },
	repository: {type: ObjectId, ref: 'Repository', required: true},
	documents: [{type: ObjectId, ref: 'Document'}],
	//DEPRECATåED
	link: String,
	file: String
	
});

var Reference = mongoose.model("Reference", referenceSchema);

module.exports = Reference;
