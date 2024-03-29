const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId} = Schema.Types;

var tagSchema = new Schema({
	created: {type: Date, default: Date.now},
	label: {type: String, index: true},
	color: String,
	workspace: {type: ObjectId, ref: 'Workspace'}
});

var Tag = mongoose.model("Tag", tagSchema);

module.exports = Tag;
