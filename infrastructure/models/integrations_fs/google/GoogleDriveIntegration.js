const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId} = Schema.Types;

var googleDriveIntegrationSchema = new Schema({
	created: {type: Date, default: Date.now},
    accessToken: String,
    refreshToken: String,
    idToken: String,
    scope: String,
    profileId: String,
    user: {type: ObjectId, ref: 'User'},
    workspace: {type: ObjectId, ref: 'Workspace'},
    repositories: [{type: ObjectId, ref: 'Repository'}]
});

var GoogleDriveIntegration = mongoose.model("GoogleDriveIntegration", googleDriveIntegrationSchema);

module.exports = GoogleDriveIntegration;
