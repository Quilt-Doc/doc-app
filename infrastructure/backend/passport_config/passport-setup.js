const passport = require("passport");
const GithubStrategy = require("passport-github2").Strategy;
const User = require("../models/authentication/User");

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

passport.use(
    new GithubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID, /*"Iv1.42c86ad42af65b91",*/ /*process.env.GITHUB_CLIENT_Id,*/
            clientSecret:  process.env.GITHUB_CLIENT_SECRET, /* "a7dad0ce0330652d3dc0bf403f685a3de9d7b04b",*/
            // Test
            callbackURL: "https://api.getquilt.app/api/auth/github/redirect"
        },
        async (accessToken, refreshToken, profile, done) => {
            let currentUser = await User.findOne({
                domain: 'github',
                profileId: profile.id,
            })
            if (!currentUser) {
                const user = await new User({
                    domain: 'github',
                    username: profile.username,
                    profileId: profile.id,
                    accessToken: accessToken,
                    refreshToken: refreshToken
                }).save();
                if (user) {
                    done(null, user);
                }
            }
            else {
                let updatedUser = await User.findByIdAndUpdate(currentUser._id, { accessToken, refreshToken }, { new: true })
                done(null, updatedUser)
            }
        }
    )
)