import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { User, UserDocument } from "../models/user";

export const googleStrategy = new GoogleStrategy(
    {
        clientID: process.env.clientID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async function (accessToken: string, refreshToken: string, profile: Profile, done: (error: any, user?: UserDocument | false) => void) {
        // console.log("passport callback function fired:");
        // console.log(profile);
        try {
            // check if the user already exists in our DB
            const currentUser = await User.findOne({ googleId: profile.id });
            if (currentUser) {
                // already have the user
                // console.log("User already exists");
                // console.log(currentUser);
                done(null, currentUser);
            } else {
                // if not, create the user in our DB
                // console.log("Creating new user");
                console.log(profile);

                const newUser = new User({
                    name: profile.displayName,
                    googleId: profile.id,
                    emailId: profile.emails[0].value,
                    photo: profile.photos[0].value,
                });

                await newUser.save();
                // console.log("New user created: ", newUser);
                done(null, newUser);
            }
        } catch (error) {
            console.error("Error in Google strategy callback:", error);
            done(error, false);
        }
    }
);
