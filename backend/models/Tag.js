const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId} = Schema.Types;

var tagSchema = new Schema({
	created: {type: Date, default: Date.now},
	folder: {type: ObjectId, ref: 'Folder'},
	title: String,
	color: String,
});

var Tag = mongoose.model("Tag", tagSchema);

module.exports = Tag;
