const passport = require("passport");

const User = require("../models/authentication/User");
const GithubAuthProfile = require("../models/authentication/GithubAuthProfile");

const GithubStrategy = require("passport-github2").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;

var mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

/*
passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // deserialize the cookieUserId to user in the database
passport.deserializeUser((id, done) => {
    console.log("USER ID", id)
    User.findById(id)
        .then(user => {
            done(null, user);
        })
        .catch(e => {
            done(new Error("Failed to deserialize an user"));
        });
});
*/
//authentication
passport.use(
    new GithubStrategy(
        {
            clientID:
                process.env
                    .GITHUB_CLIENT_ID /*"Iv1.42c86ad42af65b91",*/ /*process.env.GITHUB_CLIENT_Id,*/,
            clientSecret:
                process.env
                    .GITHUB_CLIENT_SECRET /* "a7dad0ce0330652d3dc0bf403f685a3de9d7b04b",*/,
            // Test
            // TODO:
            callbackURL: "http://localhost:3001/api/auth/github/redirect",
        },
        async (accessToken, refreshToken, profile, done) => {
            let currentUser = await User.findOne({
                domain: "github",
                profileId: profile.id,
            }).populate("workspaces");

            console.log("THIS IS THE CURRENT USER", currentUser);

            const currentMillis = new Date().getTime();
            // Access Tokens expire in 8 hours
            // I'm setting to 1 hour, to force the token-manager to refresh it and get an expire time from github
            var accessTokenExpireTime = currentMillis + 1 * 60 * 60 * 1000;
            // Refresh Tokens expire in 6 months
            // I'm setting to 1 hour, to force the token-manager to refresh it and get an expire time from github
            var refreshTokenExpireTime = currentMillis + 1 * 60 * 60 * 1000;

            if (!currentUser) {
                // KARAN TODO: Remove 'accessToken', 'refreshToken', 'domain' fields from here
                const user = await new User({
                    domain: "github",
                    domainGithub: true,
                    username: profile.username,
                    profileId: profile.id,
                    // accessToken: accessToken,
                    // refreshToken: refreshToken
                }).save();

                const githubAuthProfile = await new GithubAuthProfile({
                    user: ObjectId(user._id.toString()),
                    accessToken: accessToken,
                    accessTokenExpireTime,
                    refreshToken: refreshToken,
                    refreshTokenExpireTime,
                    status: "valid",
                }).save();

                if (user) {
                    done(null, user);
                }
            } else {
                // let updatedUser = await User.findByIdAndUpdate(currentUser._id, { accessToken, refreshToken }, { new: true });

                // Delete old GithubAuthProfiles
                var deleteManyResponse = await GithubAuthProfile.deleteMany({
                    user: ObjectId(currentUser._id.toString()),
                });

                // Create new GithubAuthProfile
                var newGithubAuthProfile = await new GithubAuthProfile({
                    user: ObjectId(currentUser._id.toString()),
                    accessToken: accessToken,
                    accessTokenExpireTime,
                    refreshToken: refreshToken,
                    refreshTokenExpireTime,
                    status: "valid",
                }).save();

                done(null, currentUser);
            }
        }
    )
);

//google strategy
passport.use(
    new GoogleStrategy(
        {
            clientID:
                "853252530536-gp2q5g9qla3hmdrfggl6lkq6tnsdcdqr.apps.googleusercontent.com",
            clientSecret: "U0zcrinRVgKyA_D8KH5W29ny",
            callbackURL:
                "http://localhost:3001/api/integrations/connect/google/callback",
        },
        (accessToken, refreshToken, profile, cb) => {
            console.log("IN HERE", { accessToken, refreshToken, profile });
            const usefulParams = { accessToken, refreshToken, profile };
            return cb(null, usefulParams);
        }
    )
);
