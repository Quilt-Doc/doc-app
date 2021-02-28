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
    self: {type: String},
    jiraId: {type: String},
    key:{type: String},
    projectTypeKey:{type: String},
    simplified:{type: Boolean},
    style: {type: String},
    isPrivate: {type: Boolean},

    cloudId: {type: String},
    jiraSiteId: {type: ObjectId, ref: 'JiraSite'},


    // Github Project fields
    repositoryId: { type: ObjectId, ref: 'Repository'},
    projectId: { type: String, required: true },
    number: { type: Number, required: true },

    columns: [{ type: String, required: true }],
    columnIdList: [{type: Number, required: true}],

    body: { type: String, required: true },
    state:  { type: String, enum: ['open', 'closed', 'all']},

    createdAt: { type: Date},
    updatedAt: { type: Date },

});

let IntegrationBoard = mongoose.model(
    "IntegrationBoard",
    integrationBoardSchema
);

module.exports = IntegrationBoard;
