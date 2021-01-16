const IntegrationAttachment = require("./IntegrationAttachment");

const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

const integrationTicketSchema = new Schema({
    created: { type: Date, default: Date.now },

    // Generalized fields
    source: {
        type: String,
        enum: ["jira", "github", "trello"],
        required: true,
    },
    description: { type: String }, // trelloCardDescription, githubCardNote: String
    sourceCreationDate: { type: Date },

    // Generalized fields that haven't been fully adopted yet.
    name: { type: String }, // trelloCardName: String,
    sourceId: { type: String }, // trelloCardId: String,
    link: { type: String }, // trelloCardLink: String,

    creator: { type: ObjectId, ref: "IntegrationUser" },
    assignees: [{ type: ObjectId, ref: "IntegrationUser" }], // trelloCardMember
    members: [{ type: ObjectId, ref: "IntegrationUser" }],
    labels: [{ type: ObjectId, ref: "IntegrationLabel" }], //trelloCardLabels
    board: { type: ObjectId, ref: "IntegrationBoard" },
    column: { type: ObjectId, ref: "IntegrationColumn" }, //  trelloCardList: String,
    comments: [{ type: ObjectId, ref: "IntegrationComments" }],
    attachments: [{ type: ObjectId, ref: "IntegrationAttachment" }],
    intervals: [{ type: ObjectId, ref: "IntegrationInterval" }],

    // Trello specific fields
    trelloCardDue: Date,
    trelloCardDueComplete: Boolean,
    trelloCardDateLastActivity: Date,

    // Github specific fields
    githubCardGithubProjectId: { type: ObjectId, ref: "GithubProject" },
    githubCardId: { type: String },
    githubCardColumnId: { type: String },
    githubCardUpdatedAt: { type: Date },
    githubCardContentUrl: { type: String },
    githubCardPullRequest: { type: ObjectId, ref: "PullRequest" },
    githubCardIssue: { type: ObjectId, ref: "GithubIssue" },

    // Github Card Fields that have moved to general fields
    // githubCardCreatedAt: { type: Date } --> sourceCreationDate: { type: Date }
    // githubCardNote: { type: String } --> description: { type: String }

    // Jira specific fields
    jiraSiteId: { type: ObjectId, ref: "JiraSite" },
    jiraProjectId: { type: ObjectId, ref: "IntegrationBoard" },
    jiraIssueId: { type: String },
    jiraIssueKey: { type: String },
    jiraIssueSummary: { type: String },
    jiraIssueDescription: { type: String },
    jiraIssueResolutionStatus: { type: Boolean },
    jiraIssueResolutionDate: { type: Date },
    jiraIssueCreationDate: { type: Date },
    jiraIssueUpdatedDate: { type: Date },


    // Github Issue specific fields
    repositoryId: { type: ObjectId, ref: 'Repository' },
    // id: repositoryIssueObj.id, --> sourceId
    githubIssueHtmlUrl: { type: String },
    githubIssueNumber: { type: Number },
    githubIssueState: { type: String },
    githubIssueTitle: { type: String },
    githubIssueBody:  { type: String },
    githubIssueUserId: { type: String },
    githubIssueLabels: [{ type: String }],
    githubIssueLocked: { type: String },
    githubIssueCommentNumber: { type: Number },
    githubIssueClosedAt: { type: Date, default: null },
    githubIssueCreatedAt: { type: Date },
    githubIssueUpdatedAt:{ type: Date },
    githubIssueAuthorAssociation: { type: String },

});

const IntegrationTicket = mongoose.model(
    "IntegrationTicket",
    integrationTicketSchema
);

module.exports = IntegrationTicket;
