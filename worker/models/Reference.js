const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;



var referenceSchema = new Schema({
	name: {type: String, index: true, required: true},
	repository: {type: ObjectId, ref: 'Repository', required: true},
	kind: {type: String, index: true, required: true},
	path: {type: String, index: true },
	parseProvider: {type: String, enum: ['create', 'update', 'semantic', 'doxygen'], required: true},
	description: String,
	lineNum: Number,
	position: String,
	created: {type: Date, default: Date.now },
	tags: [{type: ObjectId, ref: 'Tag'}],

	// Reporting Attributes
	status: {type: String, enum: ['valid', 'invalid'], default: 'valid', required: true},
	breakCommit: {type: String}
});


var Reference = mongoose.model("Reference", referenceSchema);

module.exports = Reference;