const IntegrationAttachment = require("./IntegrationAttachment");

const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

const integrationTicketSchema = new Schema({

    repositories: [{type: ObjectId, ref: 'Repository'}],
    workspace: {type: ObjectId, ref: 'Workspace'},
    created: {type: Date, default: Date.now},

    name: String, // trelloCardName: String,
    source: String, // type: String,
    sourceId: String, // trelloCardId: String,
    description: String, // trelloCardDescription: String
    sourceCreationDate: Date,
    link: String, // trelloCardLink: String,
    creator: {type: ObjectId, ref: 'IntegrationUser'},
    assignees: [{type: ObjectId, ref: 'IntegrationUser'}], // trelloCardMember
    events: [{type: ObjectId, ref: 'IntegrationEvent'}], // trelloCardListUpdateDates: [{type: Date}],
    labels: [{type: ObjectId, ref: 'IntegrationLabel'}], //trelloCardLabels
    board: [{type: ObjectId, ref: 'IntegrationBoard'}],
    column: [{type: ObjectId, ref: 'IntegrationColumn'}], //  trelloCardList: String,
    comments: [{type: ObjectId, ref: 'IntegrationComments'}],
    attachments: [type: ObjectId, ref: 'IntegrationAttachments'],

    trelloIntegration: { type: ObjectId, ref: 'TrelloIntegration'},
    trelloCardRelevantMembers: [{type: Object}],
    trelloCardDue: Date,
    trelloCardDueComplete: Boolean,
    trelloCardDateLastActivity: Date,
    trelloCardAttachments: [{type: Object}],
    
});

const IntegrationTicket = mongoose.model("IntegrationTicket", integrationTicketSchema);

module.exports = IntegrationTicket;
