const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

var integrationIntervalSchema = new Schema({
    created: { type: Date, default: Date.now },
    integrationTicket: { type: ObjectId, ref: "IntegrationTicket" },
    start: Date,
    end: Date,
    event: { type: ObjectId, ref: "IntegrationEvent" },
    drive: { type: ObjectId, ref: "IntegrationDrive" },
    board: { type: ObjectId, ref: "IntegrationBoard" },
});

var IntegrationInterval = mongoose.model(
    "IntegrationInterval",
    integrationIntervalSchema
);

module.exports = IntegrationInterval;
