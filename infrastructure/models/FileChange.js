const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let fileChangeSchema = new Schema({
    repository: { type: ObjectId, ref: 'Repository' },

    operation: { type: String, enum: ['Add', 'Modify', 'Delete', 'Rename'], required: true },
    filePath: { type: String, required: true },
    reference: {type: ObjectId, ref: 'Reference'},

    patch: { type: String, required: true },
    commit: { type: ObjectId, ref: 'Commit' },
    pullRequest: { type: ObjectId, ref: 'PullRequest' },

});

let FileChange = mongoose.model("FileChange", fileChangeSchema);

module.exports = FileChange;