const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

const integrationAttachmentSchema = new Schema({
    created: { type: Date, default: Date.now },

    //MOST IMPORTANT:
    modelName: String,
    sourceId: String,
    repository: { type: ObjectId, ref: "Repository" },

    link: String,
    sourceCreationDate: Date,
});

const IntegrationAttachment = mongoose.model(
    "IntegrationAttachment",
    integrationAttachmentSchema
);

module.exports = IntegrationAttachment;
