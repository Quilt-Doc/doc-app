const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let commitSchema = new Schema({

    created: {type: Date, default: Date.now },

    repository: { type: ObjectId, ref: 'Repository', required: true },
    installationId: { type: Number, required: false },

    name: { type: String },
    description: { type: String },
    sourceId: { type: String },
    creator: { type: ObjectId, ref: "IntegrationUser" },
    sourceCreationDate: { type: Date },

    sha: {type: String, required: true},
    ref: {type: String},

    committerDate: {type: String},
    treeHash: {type: String},
    authorName: {type: String},
    committerName: {type: String},
    committerEmail: {type: String},
    commitMessage: {type: String, required: true},
    fileList: [{ type: String }],

    githubId: {type: Number},

    pusher: {type: String},

    parents: [{ type: ObjectId, ref: 'Commit' }],

    fileChangeList: [{ type: ObjectId, ref: 'FileChange'}]

});

/*
                # commit hash
                # committer date 
                # tree hash
                # author name
                # committer name
                # committer email
                # ref name given on the command line by which the commit was reached
                # parent hashes
                # ref names without the " (", ")" wrapping.
*/

let Commit = mongoose.model("Commit", commitSchema);

module.exports = Commit;