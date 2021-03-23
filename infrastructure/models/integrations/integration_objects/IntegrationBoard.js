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
    integrationCreator: { type: ObjectId, ref: "User" },
    isDeauthorized: Boolean,

    // Jira Project fields
    self: { type: String },
    jiraId: { type: String },
    key: { type: String },
    projectTypeKey: { type: String },
    simplified: { type: Boolean },
    style: { type: String },
    isPrivate: { type: Boolean },

    cloudId: { type: String },
    jiraSiteId: { type: ObjectId, ref: "JiraSite" },

    // Github Project fields
    repositoryId: { type: ObjectId, ref: "Repository" },
    projectId: { type: String },
    number: { type: Number },

    columns: [{ type: String }],
    columnIdList: [{ type: Number }],

    body: { type: String },
    state: { type: String, enum: ["open", "closed", "all"] },

    createdAt: { type: Date },
    updatedAt: { type: Date },
});

let IntegrationBoard = mongoose.model(
    "IntegrationBoard",
    integrationBoardSchema
);

module.exports = IntegrationBoard;
