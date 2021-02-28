const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

const integrationAttachmentSchema = new Schema({
    created: { type: Date, default: Date.now },

    //MOST IMPORTANT:
    modelType: String,
    sourceId: String,
    repository: { type: ObjectId, ref: "Repository" },
    isAssociation: { type: Boolean, default: false },
    board: { type: ObjectId, ref: "IntegrationBoard" },

    link: String,
    sourceCreationDate: Date,
});

const IntegrationAttachment = mongoose.model(
    "IntegrationAttachment",
    integrationAttachmentSchema
);

module.exports = IntegrationAttachment;
