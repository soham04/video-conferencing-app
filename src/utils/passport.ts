import passport from 'passport';
import { googleStrategy } from '../config/google-strategy';
import { User } from "../models/user";


passport.serializeUser((user: any, done: any) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: any, done: any) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

passport.use(googleStrategy);

export default passport;
