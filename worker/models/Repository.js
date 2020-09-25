const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

// split name into name, owner
// add default branch
var repositorySchema = new Schema({
	fullName: {type: String, index: true},
	link: String,
	lastProcessedCommit: { type: String, default: ''},
	installationId: Number,
	htmlUrl: String,
	cloneUrl: String,
	created: {type: Date, default: Date.now },
	icon: Number,
	scanned: {type: Boolean, default: false, required: true},
	currentlyScanning: {type: Boolean, default: false, required: true}
});


var Repository = mongoose.model("Repository", repositorySchema);

module.exports = Repository;
