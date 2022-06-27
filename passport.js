const passport = require("passport");
const googleStrategy = require('./google-strategy');
const User = require("./models/user")

// giving a name to a strategy so we can refer it in routes
passport.serializeUser(function (User, done) {
    done(null, User.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
        done(null, user);
    });
});
passport.use(googleStrategy);

module.exports = passport