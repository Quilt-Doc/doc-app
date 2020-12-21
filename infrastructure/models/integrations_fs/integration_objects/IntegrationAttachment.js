const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

const integrationAttachmentSchema = new Schema({
    created: {type: Date,  default: Date.now},
    type: String,
    link: String,
    identifier: String,
    sourceCreationDate: Date,
    repository: {type: ObjectId, ref: 'Repository'},
    element: ObjectId
});

const IntegrationAttachment = mongoose.model("IntegrationAttachment", integrationAttachmentSchema);

module.exports = IntegrationAttachment;
