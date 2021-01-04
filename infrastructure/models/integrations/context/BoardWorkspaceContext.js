const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

const boardWorkspaceContextSchema = new Schema({
    created: { type: Date, default: Date.now },
    board: { type: ObjectId, ref: "IntegrationBoard" },
    workspace: { type: ObjectId, ref: "Workspace" },
    repositories: [{ type: ObjectId, ref: "Repository" }],
    creator: [{ type: ObjectId, ref: "User" }],
    type: String,
});

const BoardWorkspaceContext = mongoose.model(
    "BoardWorkspaceContext",
    boardWorkspaceContextSchema
);

module.exports = BoardWorkspaceContext;
