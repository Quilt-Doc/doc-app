const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let commitSchema = new Schema({

    created: {type: Date, default: Date.now },

    repository: { type: ObjectId, ref: 'Repository', required: true },
    installationId: { type: Number, required: true },

    sha: {type: String, required: true},
    ref: {type: String, required: true},

    githubId: {type: Number},

    commitMessage: {type: String, required: true},
    commitTime: {type: Date, required: true},

    pusher: {type: String, required: true},

    parents: [{ type: ObjectId, ref: 'Commit' }],

    fileChangeList: [{ type: ObjectId, ref: 'FileChange', required: true }]

});

let Commit = mongoose.model("Commit", commitSchema);

module.exports = Commit;