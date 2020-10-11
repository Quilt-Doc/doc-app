const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

// split name into name, owner
// add default branch
var repositorySchema = new Schema({
	fullName: {type: String, index: true},
	lastProcessedCommit: { type: String, default: ''},
	defaultBranch: {type: String},
	installationId: {type: Number, index: true},
	htmlUrl: String,
	cloneUrl: String,
	created: {type: Date, default: Date.now },
	icon: Number,
	scanned: {type: Boolean, default: false, required: true},
	currentlyScanning: {type: Boolean, default: false, required: true}
});


var Repository = mongoose.model("Repository", repositorySchema);

module.exports = Repository;
