import { Router, Request, Response, NextFunction } from 'express';
import passport from '../utils/passport';
import { room_history } from '../models/room-history';
import { User } from '../models/user';

const router = Router();

// Define a custom interface for the user object
interface User {
    name: string;
    emailId: string;
    photo: string;
    googleId: string;
    // Add other properties if needed
}

// Home Page Route
router.get("/", (req: Request, res: Response) => {
    if (req.user) {
        res.redirect("/dash"); // Redirect logged-in users to dashboard
    } else {
        res.render("home", { appname: process.env.APPNAME });
    }
});

// Dashboard Route
router.get("/dash", isLoggedIn, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const roomHistories = await room_history.find({ user_id: (req.user as User).googleId }).sort({ time: -1 });
        res.render("dash", {
            user: (req.user as User).name,
            mail: (req.user as User).emailId,
            image: (req.user as User).photo,
            googleId: (req.user as User).googleId,
            room_hist: roomHistories,
            appname: process.env.APPNAME,
        });
    } catch (error) {
        console.error("Error fetching User history:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Google Authentication Routes
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email", "openid"] }));
router.get("/auth/google/callback", passport.authenticate("google", { successRedirect: "/dash", failureRedirect: "/failed_login" }));
router.get("/failed_login", (req: Request, res: Response) => res.send("Login Failed"));
router.get("/logout", (req: Request, res: Response) => {
    req.logout(function (err) {
        if (err) { return res.send("Error Logging out"); }
        res.redirect('/');
    });
    // res.send("Logged Out");
});

// Create New Room Route
router.post("/makenew", isLoggedIn, (req: Request, res: Response) => {
    req.session.meet_name = req.body.meet_name;
    const roomid = generateRoomId();
    res.redirect(`/room/${roomid}`);
});


// Meeting Room Route
router.get("/room/:roomid", isLoggedIn, async (req: Request, res: Response) => {
    const roomid = req.params.roomid;
    let roomName = req.session.meet_name;
    try {
        let roomHistory = await room_history.findOne({ room_id: roomid }).exec();
        if (roomHistory) {
            roomName = roomHistory.meet_name;
        }
        res.render("home_app", {
            user: (req.user as User).name,
            mail: (req.user as User).emailId,
            roomname: roomName,
            image: (req.user as User).photo,
            googleId: (req.user as User).googleId,
            roomid: roomid,
            appname: process.env.APPNAME,
        });
    } catch (error) {
        console.error("Error fetching room history:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Middleware to check if user is logged in
function isLoggedIn(req: Request, res: Response, next: NextFunction) {
    if (req.user) {
        next();
    } else {
        req.session.reqUrl = req.originalUrl;
        res.redirect("/auth/google");
    }
}

// Function to generate a random room ID
function generateRoomId(): string {
    const characters = "abcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < 3; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result + "-" + Math.random().toString(36).substr(2, 4) + "-" + Math.random().toString(36).substr(2, 4);
}

export default router;
