// var rootReq = require.bind( require.main );

const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let userSchema = new Schema({
    username: {type: String, index: true},
    accessToken: String,
    refreshToken: String, 
    profileId: String,
    email: {type: String, index: true},
    created: {type: Date, default: Date.now },
    domain: String,
    workspaces: [{type: ObjectId, ref: 'Workspace'}],
    // 'dev', 'user'
    role: {type: String, default: 'user'}
});

let User = mongoose.model("User", userSchema);

module.exports = User;