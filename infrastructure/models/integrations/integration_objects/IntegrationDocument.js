const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

const integrationDocumentSchema = new Schema({
    created: { type: Date, default: Date.now },
    name: String,
    source: {
        type: String,
        enum: ["google"],
        required: true,
    },
    members: [{ type: ObjectId, ref: "IntegrationUser" }],
    attachments: [{ type: ObjectId, ref: "IntegrationAttachment" }],
    intervals: [{ type: ObjectId, ref: "IntegrationInterval" }],
    link: String,
    sourceId: { type: String, index: true },
    mimeType: String,
    sourceCreationDate: Date,
    sourceUpdateDate: Date,
    drive: { type: ObjectId, ref: "IntegrationDrive" },
});

const IntegrationDocument = mongoose.model(
    "IntegrationDocument",
    integrationDocumentSchema
);

module.exports = IntegrationDocument;
