const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let commentSchema = new Schema({
    created: Date,
    author: ObjectId,
    text: String,
    type: String,
    targetObject: ObjectId
});

let Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
