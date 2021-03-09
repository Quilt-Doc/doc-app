const mongoose = require.main.require("mongoose");

const Schema = mongoose.Schema;

const { ObjectId } = Schema.Types;

let integrationDriveSchema = new Schema({
    created: { type: Date, default: Date.now },
    name: String,
    source: { type: String, enum: ["google"] },
    sourceId: String, // == jiraId
    repositories: [{ type: ObjectId, ref: "Repository" }],
    integrationCreator: { type: ObjectId, ref: "User" },
    isPersonal: Boolean,
    sourceCreationDate: Date,
});

let IntegrationDrive = mongoose.model(
    "IntegrationDrive",
    integrationDriveSchema
);

module.exports = IntegrationDrive;
