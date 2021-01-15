const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let integrationBoardSchema = new Schema({
    created: { type: Date, default: Date.now },
    creator: { type: ObjectId, ref: "IntegrationUser" },
    name: String,
    link: String,
    source: String,
    sourceId: String,
});

let IntegrationBoard = mongoose.model(
    "IntegrationBoard",
    integrationBoardSchema
);

module.exports = IntegrationBoard;
