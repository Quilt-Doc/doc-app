const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

var integrationEventSchema = new Schema({
    created: {type: Date, default: Date.now},
    creator: {type: ObjectId, ref: 'IntegrationUser'},
    action: String,
    source: String,
    sourceId: String,
    sourceCreationDate: Date,
    type: String
});

var IntegrationEvent = mongoose.model("IntegrationEvent", integrationEventSchema);

module.exports = IntegrationEvent;
