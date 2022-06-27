const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./models/user")

const googleStrategy = new GoogleStrategy(
    {
        clientID: process.env.clientID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, done) {
        console.log("passport callback function fired:");
        console.log(profile);
        // check if the user already exists in our DB

        User.findOne({
            googleId: profile.id,
        }).then((currentUser) => {
            if (currentUser) {
                // already have the user
                console.log("User already made");
                console.log(currentUser);

                done(null, currentUser);
            } else {
                // if not create the user in our db
                console.log("Creating new user");
                console.log(currentUser);

                new User({
                    name: profile.displayName,
                    googleId: profile.id,
                    emailId: profile.emails[0].value,
                    photo: profile.photos[0].value,
                })
                    .save()
                    .then((newUser) => {
                        console.log("new user created: ", newUser);
                    });

                done(null, currentUser);
            }
        });
    }
)

module.exports = googleStrategy;
