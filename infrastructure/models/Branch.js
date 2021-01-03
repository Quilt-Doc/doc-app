const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

/* Suggested Spec: 
    name: String
    sourceId: String (name === sourceId === ref)
    commit: Commit
    repository
    installationId

    user: IntegrationUser —- replaces githubUserId
    masterBranch
    creator: IntegrationUser
    members: [IntegrationUser] —- all relevant members including those working on the branch

    commits: [Commit] —- unique commits of the branch
    sourceCreationDate: Date
    sourceCloseDate: Date
*/

let branchSchema = new Schema({
    repository: { type: ObjectId, ref: 'Repository' },
    installationId: { type: Number, required: true },

    ref: { type: String, required: true },
    label: { type: String },

    pullRequestObjIdList: [{ type: String }],
    pullRequests: [{type: ObjectId, ref: 'PullRequest'}],

    lastCommit: { type: String },// { type: ObjectId, ref: 'Commit' },


    commitUser: { type: ObjectId, ref: 'IntegrationUser' },
    members: { type: ObjectId, ref: 'IntegrationUser' },
    commits: [{ type: ObjectId, ref: 'Commit' }],

    masterBranch: { type: String},
});

let Branch = mongoose.model("Branch", branchSchema);

module.exports = Branch;