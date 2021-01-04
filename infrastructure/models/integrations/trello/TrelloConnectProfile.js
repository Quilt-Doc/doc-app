const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let trelloConnectProfileSchema = new Schema({
    user: { type: ObjectId, ref: "User" },

    authorizeToken: { type: String, index: true },
    authorizeTokenSecret: String,

    accessToken: { type: String, index: true },
    accessTokenSecret: String,

    sourceId: String,
    isReady: { type: Boolean, default: false },
});

let TrelloConnectProfile = mongoose.model(
    "TrelloConnectProfile",
    trelloConnectProfileSchema
);

module.exports = TrelloConnectProfile;
