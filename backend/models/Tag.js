const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId} = Schema.Types;

var tagSchema = new Schema({
	created: Date,
	project: {type: ObjectId, ref: 'Project'},
	title: String,
	color: String,
});

var Tag = mongoose.model("Tag", tagSchema);

module.exports = Tag;
