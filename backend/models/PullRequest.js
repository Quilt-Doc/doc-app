const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let pullRequestSchema = new Schema({
    created: {type: Date, default: Date.now },
    installationId: {type: Number, required: true},
    status: {type: String, required: true},
    headRef: {type: String, required: true},
    baseRef: {type: String, required: true},
    checks: [{type: ObjectId, ref: 'Check'}],
    pullRequestObjId: {type: Number, required: true},
    pullRequestNumber: {type: Number, required: true},
    repository: {type: ObjectId, ref: 'Repository', required: true}
});

let PullRequest = mongoose.model("PullRequest", pullRequestSchema);

module.exports = PullRequest;