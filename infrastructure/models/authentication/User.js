// var rootReq = require.bind( require.main );

const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let userSchema = new Schema({
    firstName: {type: String},
    lastName: {type: String},
    email: {type: String, index: true},
    created: {type: Date, default: Date.now },
    bio: String,
    organization: String,
    position: String,
    workspaces: [{type: ObjectId, ref: 'Workspace'}],
    onboarded: {type: Boolean, default: false},
    verified: {type: Boolean, default: false},
    // 'dev', 'user'
    role: {type: String, default: 'user'},

    // Github Attributes:

    username: {type: String, index: true},
    profileId: String,
    domainGithub: {type: Boolean, default: false},


    // Deprecated
    domain: String,
    // accessToken: String,
    // refreshToken: String,

});

let User = mongoose.model("User", userSchema);

module.exports = User;