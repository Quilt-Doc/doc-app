const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let userSchema = new Schema({
    created: Date,
    username: String,
    email: String,
    workspaces: [{type: ObjectId, index: true}]
});

let User = mongoose.model("User", userSchema);

module.exports = User;