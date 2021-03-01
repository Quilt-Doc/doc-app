const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let jiraPersonalAccessTokenSchema = new Schema({
    userId: {type: ObjectId, ref: 'User', required: true},
    value: { type: String, required: true },
});

let JiraPersonalAccessToken = mongoose.model("JiraPersonalAccessToken", jiraPersonalAccessTokenSchema);

module.exports = JiraPersonalAccessToken;