const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let userSchema = new Schema({
    username: String,
    accessToken: String,
    refreshToken: String, 
    profileID: String,
    email: String,
    created: {type: Date, default: Date.now },
    domain: String,
    workspaces: [{type: ObjectId, index: true, ref: 'Workspace'}]
});

let User = mongoose.model("User", userSchema);

module.exports = User;