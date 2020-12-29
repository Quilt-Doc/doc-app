const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let branchSchema = new Schema({
    repository: { type: ObjectId, ref: 'Repository' },

    ref: { type: String, required: true },
    masterBranch: { type: String, required: true },
    installationId: { type: Number, required: true },
    githubUserId: { type: Number, required: true },
});

let Branch = mongoose.model("Branch", branchSchema);

module.exports = Branch;