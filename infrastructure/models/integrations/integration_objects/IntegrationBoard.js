const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let integrationBoardSchema = new Schema({
    created: { type: Date, default: Date.now },
    creator: { type: ObjectId, ref: "IntegrationUser" },
    name: String,
<<<<<<< HEAD
    source: { type: String, enum: ["jira", "trello", "github"] },
    sourceId: String, // == jiraId


    // Jira Project fields
    self: {type: String, required: true},
    jiraId: {type: String, required: true},
    key:{type: String, required: true},
    name: {type: String, required: true},
    projectTypeKey:{type: String, required: true},
    simplified:{type: Boolean, required: true},
    style: {type: String, required: true},
    isPrivate: {type: Boolean, required: true},

    cloudId: {type: String, required: true},
    jiraSiteId: {type: ObjectId, ref: 'JiraSite', required: true},


=======
    link: String,
    source: String,
    sourceId: String,
>>>>>>> 3089ccf8c4668a91045e20e8991b3db0d36ad830
});

let IntegrationBoard = mongoose.model(
    "IntegrationBoard",
    integrationBoardSchema
);

module.exports = IntegrationBoard;
