const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

var referenceSchema = new Schema({
	name: String,
	kind: String,
	file: String,
	lineNum: Number,
	link: String,
	created: {type: Date, default: Date.now }
});

var Reference = mongoose.model("Reference", referenceSchema);

module.exports = Reference;
