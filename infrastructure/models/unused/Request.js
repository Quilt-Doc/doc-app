const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let requestSchema = new Schema({
    created: {type: Date, default: Date.now },
    creator: {type: ObjectId, ref: 'User'},
    targetUser: {type: ObjectId, ref: 'User'},
    targetObject: ObjectId,  // has multiple object references -- needs resolution
    type: String,
    title: String, 
    description: String,
});

let Request  = mongoose.model("Request", requestSchema);

module.exports = Request;