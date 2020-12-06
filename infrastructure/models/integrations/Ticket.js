const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let ticketSchema = new Schema({
    source: {type: String, enum: ['jira', 'github', 'trello'], required: true},
    jiraSiteId: {type: ObjectId, ref: 'JiraSite', required: true},
    jiraProjectId: {type: ObjectId, ref: 'JiraProject', required: true},
    jiraSummary: {type: String, required: true},
    jiraTicketId: {type: String, required: true},
});

let Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;