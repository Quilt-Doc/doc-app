const passport = require("passport");
const GithubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");

passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // deserialize the cookieUserId to user in the database
passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user);
        })
        .catch(e => {
            done(new Error("Failed to deserialize an user"));
        });
});

passport.use(
    new GithubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret:  process.env.GITHUB_CLIENT_SECRET,
            callbackURL: "/api/auth/github/redirect"
        },
        async (accessToken, refreshToken, profile, done) => {
            let currentUser = await User.findOne({
                domain: 'github',
                profileID: profile.id,
            })
            if (!currentUser) {
                const user = await new User({
                    domain: 'github',
                    profileID: profile.id,
                    accessToken: accessToken,
                    refreshToken: refreshToken
                }).save();
                if (user) {
                    done(null, user);
                }
            }
            let updatedUser = await User.findByIdAndUpdate(currentUser._id, { accessToken, refreshToken }, { new: true })
            done(null, updatedUser)
        }
    )
)

