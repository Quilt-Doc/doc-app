const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let integrationBoardSchema = new Schema({
    created: { type: Date, default: Date.now },
    creator: { type: ObjectId, ref: "IntegrationUser" },
    name: String,
    source: { type: String, enum: ["jira", "trello", "github"] },
    sourceId: String, // == jiraId
    link: String,
    repositories: [{ type: ObjectId, ref: "Repository" }],


    // Jira Project fields
    self: {type: String, required: true},
    jiraId: {type: String, required: true},
    key:{type: String, required: true},
    projectTypeKey:{type: String, required: true},
    simplified:{type: Boolean, required: true},
    style: {type: String, required: true},
    isPrivate: {type: Boolean, required: true},

    cloudId: {type: String, required: true},
    jiraSiteId: {type: ObjectId, ref: 'JiraSite', required: true},


    // Github Project fields
    repositoryId: { type: ObjectId, ref: 'Repository', required: true },
    projectId: { type: String, required: true },
    number: { type: Number, required: true },

    columns: [{ type: String, required: true }],
    columnIdList: [{type: Number, required: true}],

    body: { type: String, required: true },
    state:  { type: String, enum: ['open', 'closed', 'all'], required: true},

    createdAt: { type: Date, required: true},
    updatedAt: { type: Date },

});

let IntegrationBoard = mongoose.model(
    "IntegrationBoard",
    integrationBoardSchema
);

module.exports = IntegrationBoard;
