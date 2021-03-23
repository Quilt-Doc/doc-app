const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let insertHunkSchema = new Schema({
    repository: { type: ObjectId, ref: 'Repository' },

    commitSha: { type: String },
    pullRequestNumber: { type: Number },

    filePath: { type: String, required: true },
    lineStart: { type: Number, required: true },

    lines: [{ type: String, required: true }],

});

let InsertHunk = mongoose.model("InsertHunk", insertHunkSchema);

module.exports = InsertHunk;