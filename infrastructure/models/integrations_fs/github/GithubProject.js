const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let githubProjectSchema = new Schema({

    repositoryId: { type: ObjectId, ref: 'Repository', required: true },
    projectId: { type: String, required: true },
    number: { type: Number, required: true },

    columns: [{ type: String, required: true }],
    columnIdList: [{type: Number, required: true}],

    name: { type: String, required: true },
    body: { type: String, required: true },
    state:  { type: String, enum: ['open', 'closed', 'all'], required: true},

    createdAt: { type: Date, required: true},
    updatedAt: { type: Date },
});

let GithubProject = mongoose.model("GithubProject", githubProjectSchema);

module.exports = GithubProject;