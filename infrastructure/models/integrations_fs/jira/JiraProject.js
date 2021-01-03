const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let jiraProjectSchema = new Schema({
    self: {type: String, required: true},
    jiraId: {type: String, required: true},
    key:{type: String, required: true},
    name: {type: String, required: true},
    projectTypeKey:{type: String, required: true},
    simplified:{type: Boolean, required: true},
    style: {type: String, required: true},
    isPrivate: {type: Boolean, required: true},

    cloudId: {type: String, required: true},
    jiraSiteId: {type: ObjectId, ref: 'JiraSite', required: true},
});

let JiraProject = mongoose.model("JiraProject", jiraProjectSchema);

module.exports = JiraProject;