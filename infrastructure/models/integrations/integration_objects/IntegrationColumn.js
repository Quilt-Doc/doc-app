const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let integrationColumnSchema = new Schema({
    created: { type: Date, default: Date.now },
    name: String,
    source: String,
    sourceId: String,
    board: { type: ObjectId, ref: "IntegrationBoard" },
    type: String,
});

let IntegrationColumn = mongoose.model(
    "IntegrationColumn",
    integrationColumnSchema
);

module.exports = IntegrationColumn;
