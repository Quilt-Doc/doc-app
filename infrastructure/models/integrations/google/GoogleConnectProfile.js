const mongoose = require.main.require("mongoose");

const Schema = mongoose.Schema;

const { ObjectId } = Schema.Types;

let googleConnectProfileSchema = new Schema({
    user: { type: ObjectId, ref: "User" },
    accessToken: { type: String, index: true },
    refreshToken: String,
    idToken: String,
    scope: String,
    sourceId: String,
    isReady: { type: Boolean, default: false },
});

let GoogleConnectProfile = mongoose.model(
    "GoogleConnectProfile",
    googleConnectProfileSchema
);

module.exports = GoogleConnectProfile;
