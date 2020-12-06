const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId} = Schema.Types;

const ticketSchema = new Schema({
    integration: {type: ObjectId, ref: 'Integration'},
    associations: {type: String},
    relevant: {type: String},
    repository: {type: ObjectId, ref: 'Repository'},
    workspace: {type: ObjectId, ref: 'Workspace'},
    created: {type: Date, default: Date.now}
});

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
