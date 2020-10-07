var mongoose;
if (process.env.IS_LAMBDA) {
    mongoose = require("mongoose");
}
else {
    mongoose = require.main.require("mongoose");
}

const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let githubAuthProfileSchema = new Schema({

    user: {type: ObjectId, ref: 'User'},

    accessToken: {type: String, required: true},
    accessTokenExpireTime: {type: Number, required: true}, // (currentTime + 7 Hours)

    refreshToken: {type: String, required: true},
    refreshTokenExpireTime: {type: Number, required: true}, // (currentTime + 5 months)
    status: {type: String, enum: ["valid", "invalid"], required: true}
});

let GithubAuthProfile = mongoose.model("GithubAuthProfile", githubAuthProfileSchema);

module.exports = GithubAuthProfile;