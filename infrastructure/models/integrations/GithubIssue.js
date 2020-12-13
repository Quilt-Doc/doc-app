const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let githubIssueSchema = new Schema({

    repositoryId: { type: ObjectId, ref: 'Repository', required: true },
    id: {type: String, required: true},
    htmlUrl: {type: String, required: true},
    number: {type: Number, required: true},
    state: {type: String, enum: ['open', 'closed'], required: true},
    title: {type: String, required: true},
    body: {type: String, required: false},
    githubUserId: {type: Number, required: true},
    labels: [{type: String, required: true}],
    assignee: {type: String, required: true},
    assignees: [{type: String, required: true}],
    milestone: {type: String, required: true},
    locked: {type: Boolean, required: true},
    comments: { type: Number, required: true },
    pullRequest: { type: String, required: false },
    closedAt: { type: Date, required: false },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: false},
    // TODO: Add enum for this
    authorAssociation: {type: String, required: true},

});

let GithubIssue = mongoose.model("GithubIssue", githubIssueSchema);

module.exports = GithubIssue;