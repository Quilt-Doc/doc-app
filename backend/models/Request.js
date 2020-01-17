const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let requestSchema = new Schema({
    created: Date,
    creator: ObjectId,
    targetUser: ObjectId,
    targetObject: ObjectId,
    type: String,
    title: String, 
    description: String,
});

let Request  = mongoose.model("Request", requestSchema);

module.exports = Request;