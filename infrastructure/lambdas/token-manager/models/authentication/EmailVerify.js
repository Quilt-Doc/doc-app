// var rootReq = require.bind( require.main );

const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let emailVerifySchema = new Schema({
    hash: {type: String, index: true, required: true},
    user: {type: ObjectId, ref: 'User', require: true},
    email: {type: String, required: true},
    created: {type: Date, default: Date.now },
});

let EmailVerify = mongoose.model("EmailVerify", emailVerifySchema);

module.exports = EmailVerify;