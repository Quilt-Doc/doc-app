const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

// Need to index // Need to add documents
var repositoryItemSchema = new Schema({
	repository: {type: ObjectId, ref: 'Repository'},
	name: String,
	path: String,
	kind: String,
	documents: [{type: ObjectId, ref: 'Document'}],
	created: {type: Date, default: Date.now }
});

var RepositoryItem = mongoose.model("RepositoryItem", repositoryItemSchema);

module.exports = RepositoryItem
