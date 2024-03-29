const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let jiraSiteSchema = new Schema({
    cloudIds: [{type: String, required: true}],
    userId: {type: ObjectId, ref: 'User', required: true},
    workspace: {type: ObjectId, ref: 'Workspace', required: true},
    accessToken: {type: String, required: true},
    personalAccessToken: { type: String },
    jiraEmailAddress: { type: String },
    created: {type: Date, default: Date.now, required: true}
});

let JiraSite = mongoose.model("JiraSite", jiraSiteSchema);

module.exports = JiraSite;