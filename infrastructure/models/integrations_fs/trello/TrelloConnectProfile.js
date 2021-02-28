const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let trelloConnectProfileSchema = new Schema({

    user: {type: ObjectId, ref: 'User'},
    workspace: {type: ObjectId, ref: 'Workspace'},

    authorizeToken: {type: String, index: true},
    authorizeTokenSecret: String,

    accessToken: {type: String, index: true},
    accessTokenSecret: String

});

let TrelloConnectProfile = mongoose.model("TrelloConnectProfile",trelloConnectProfileSchema);

module.exports = TrelloConnectProfile;