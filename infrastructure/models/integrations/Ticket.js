const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let ticketSchema = new Schema({
    source: {type: String, enum: ['jira', 'github', 'trello'], required: true},


    githubCardGithubProjectId: { type: ObjectId, ref: 'GithubProject' },

    githubCardNote: { type: String },

    githubCardColumnId: { type: String },

    githubCardCreatedAt: { type: Date },
    githubCardUpdatedAt: { type: Date },

    

    jiraSiteId: {type: ObjectId, ref: 'JiraSite'},
    jiraProjectId: {type: ObjectId, ref: 'JiraProject'},
    jiraSummary: {type: String},
    jiraTicketId: {type: String},
});

let Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;