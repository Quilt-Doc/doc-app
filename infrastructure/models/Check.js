const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let checkSchema = new Schema({
    sha: {type: String, required: true},
    brokenDocuments: [{type: ObjectId, ref: 'Document'}],
    brokenSnippets: [{type: ObjectId, ref: 'Snippet'}],
    repository: {type: ObjectId, ref: 'Repository', required: true},
    githubId: {type: Number},
});

let Check = mongoose.model("Check", checkSchema);

module.exports = Check;