const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;

var tokenSchema = new Schema({
    installationId: Number,
    value: String,
    expireTime: Number,
    type: String,
    status: String,
});

var Token = mongoose.model("Token", tokenSchema);

module.exports = Token;