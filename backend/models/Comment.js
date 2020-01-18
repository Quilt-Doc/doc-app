const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let commentSchema = new Schema({
    created: Date,
    creator: {type: ObjectId, ref: 'User'},
    text: String,
    type: String,
    targetObject: ObjectId,
    parent: {type: ObjectId, ref: 'Comment'},
});

let Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
