const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let userSchema = new Schema({
    username: String,
    email: String,
    created: {type: Date, default: Date.now },
    workspaces: [{type: ObjectId, index: true, ref: 'Workspace'}]
});

let User = mongoose.model("User", userSchema);

module.exports = User;