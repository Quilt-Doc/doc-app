const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

var integrationIntervalSchema = new Schema({
    created: {type: Date, default: Date.now},
    start: Date,
    end: Date
});

var IntegrationInterval = mongoose.model("IntegrationInterval", integrationIntervalSchema);

module.exports = IntegrationInterval;
