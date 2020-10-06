const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let checkSchema = new Schema({
    created: {type: Date, default: Date.now },
    sha: {type: String, required: true},
    brokenDocuments: [{type: ObjectId, ref: 'Document'}],
    brokenSnippets: [{type: ObjectId, ref: 'Snippet'}],
    repository: {type: ObjectId, ref: 'Repository', required: true},
    githubId: {type: Number},

    checkUrl: {type: String},
    commitMessage: {type: String, required: true},
    pusher: {type: String, required: true},
});

let Check = mongoose.model("Check", checkSchema);

module.exports = Check;