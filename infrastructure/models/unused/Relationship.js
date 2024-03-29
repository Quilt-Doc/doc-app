const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let relationshipSchema = new Schema({
    created: {type: Date, default: Date.now },
    creator: {type: ObjectId, ref: 'User'},
    source: ObjectId,  //Can be multiple refs
    target: ObjectId,  //Can be multiple refs -- needs resolution
    type: String,
    text: String
});

let Relationship = mongoose.model("Relationship", relationshipSchema);

module.exports = Relationship;