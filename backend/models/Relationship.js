const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let relationshipSchema = new Schema({
    created: Date,
    creator: ObjectId,
    source: ObjectId,
    target: ObjectId,
    relationshipType: String,
    relationshipText: String
});

let Relationship = mongoose.model("Relationship", relationshipSchema);

module.exports = Relationship;