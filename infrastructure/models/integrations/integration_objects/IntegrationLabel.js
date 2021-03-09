const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

var integrationLabelSchema = new Schema({
    created: { type: Date, default: Date.now },
    color: String,
    name: String,
    source: String,
    sourceId: String,
    board: { type: ObjectId, ref: "IntegrationBoard" },
});

var IntegrationLabel = mongoose.model(
    "IntegrationLabel",
    integrationLabelSchema
);

module.exports = IntegrationLabel;
