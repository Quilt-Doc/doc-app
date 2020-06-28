const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

var tokenSchema = new Schema({
    installationId: Number,
    calue: String,
    expiryTime: Number,
    type: String,
});

var Token = mongoose.model("Token", tokenSchema);

module.exports = Token;