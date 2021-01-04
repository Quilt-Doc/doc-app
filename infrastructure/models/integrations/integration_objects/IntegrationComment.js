const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let integrationCommentSchema = new Schema({
    created: {type: Date, default: Date.now},
    creator: { type: ObjectId, ref: 'IntegrationUser' },
    text: String,
    source: String,
    sourceId: String,
});

let IntegrationComment = mongoose.model("IntegrationComment", integrationCommentSchema);

module.exports = IntegrationComment;
