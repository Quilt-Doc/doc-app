const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId} = Schema.Types;

const trelloIntegrationSchema = new Schema({
    boardIds: [{type: String}],
    profileId: String,
	created: {type: Date, default: Date.now},
	user: {type: ObjectId, ref: 'User'},
    workspace: {type: ObjectId, ref: 'Workspace'},
    repositories: [{type: ObjectId, ref: 'Repository'}],
    trelloConnectProfile: {type: ObjectId, ref: 'TrelloConnectProfile'},
});

const TrelloIntegration = mongoose.model("TrelloIntegration", trelloIntegrationSchema);

module.exports = TrelloIntegration;
