const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

var codebaseSchema = new Schema({
	name: String,
	workspace: {type: ObjectId, ref: 'Workspace', index: true},
	link: String,
	lastScannedDate: Date,
	scanFrequency: Date,
	created: {type: Date, default: Date.now },
	icon: Number
	references: [{type: ObjectId, ref: 'Reference', index: true}]
});

var Codebase = mongoose.model("Codebase", codebaseSchema);

module.exports = Codebase;
