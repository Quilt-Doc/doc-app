const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

var repositorySchema = new Schema({
	name: String,
	link: String,
	lastProcessedCommit: { type: String, default: ''},
	installationId: Number,
	htmlURL: String,
	cloneURL: String,
	created: {type: Date, default: Date.now },
	icon: Number,
	references: [{type: ObjectId, ref: 'Reference', index: true}]
});

var Repository = mongoose.model("Repository", repositorySchema);

module.exports = Repository;