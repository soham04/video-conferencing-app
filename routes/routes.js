"use-strict"

const express = require('express');
const router = express.Router();
const passport = require('../passport');
const room_history = require("../models/room-history")

// router.get(
//     "/.well-known/pki-validation/2D612E6A40D7726C193A28AE10DA086F.txt",
//     (req, res) => {
//         res.download(__dirname + "/2D612E6A40D7726C193A28AE10DA086F.txt");
//     }
// );

// ! HOME PAGE
const authCheckHome = (req, res, next) => {
    // console.log("Currect user" + req.user);

};

router.get("/", (req, res) => {
    // if user already loggedin, will directly go to dashboard
    // if not will go to actual home page 

    if (!req.user) {
        // next(); // not loggedin
        res.render("home", { appname: process.env.APPNAME, loggedIn: false });
    } else {
        // res.redirect("/dash");   // already loggedin 
        res.render("home", { appname: process.env.APPNAME, loggedIn: true });

    }

});

// ! AUTH CHECK | DIRECT VIDEO CONFERENCE

const authCheckDash = (req, res, next) => {
    // console.log("Currect user" + req.user);
    if (req.user) {
        next();
    } else {
        res.redirect("/");
    }
};

router.get("/dash", authCheckDash, (req, res) => {

    if (req.session.reqUrl) {
        let redirectTo = req.session.reqUrl; // If our redirect value exists in the session, use that.
        req.session.reqUrl = null; // Once we've used it, dump the value to null before the redirect.
        res.redirect(redirectTo)
    };

    // console.log(req);
    // console.log("HERE USER : ");
    // console.log("USER = " + req.user);
    // console.log(typeof req);
    // console.log(req.user.name);
    res.header(
        "Cache-Control",
        "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    // res.render("home_app", { user: req.user.name, mail: req.user.emailId, image: req.user.photo, googleId: req.user.googleId })
    // let query = room_history.find({ user_id: req.user.googleId })
    // let room_history = query.getFilter()
    let room_hist;      // variable for room-history

    room_history.find
        ({
            user_id: req.user.googleId,  // identification for searching user history
        })
        .sort([['time', -1]])
        .then((docs) => {
            res.render("dash", {    // rendering page 
                user: req.user.name,
                mail: req.user.emailId,
                image: req.user.photo,
                googleId: req.user.googleId,
                room_hist: docs,
                appname: process.env.APPNAME,
            });
        })
        .catch((err) => {
            console.log("Error fetching User history = " + err);
        })
});


// ! GOOGLE AUTH ROUTE

router.get("/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email", "openid"],
    }) // redirect to google singIn
);

// ! GOOGLE AUTH ROUTE CALLBACK

router.get("/auth/google/callback",
    passport.authenticate("google", {
        successRedirect: "/dash",
        failureRedirect: "/failed_login",
    })
);

// ! FAILED LOGIN

router.get("/failed_login", (req, res) => {
    // console.log(req);
    res.send("login fail");
});


// ! LOGED OUT

router.get("/logout", function (req, res) {
    req.logout();
    res.send("LOGED OUT");
});



function randomString(length) {
    var result = "";
    var characters = "abcdefghijklmnopqrstuvwxyz";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
function roomIdGenerate() {
    return randomString(3) + "-" + randomString(4) + "-" + randomString(3);
}
router.post("/makenew", (req, res) => {
    // console.log(req.body.meet_name);
    req.session.meet_name = req.body.meet_name
    let roomid = roomIdGenerate();
    res.redirect("room/" + roomid);
});

const authCheckMeet = (req, res, next) => {
    // console.log(req._parsedUrl);
    // console.log("Currect user" + req.user);
    if (req.user) {
        next(); // already loggedin 
    } else {
        req.session.reqUrl = req.originalUrl
        res.redirect("/auth/google"); // not loggedin    
    }
};

router.get("/room/:roomid", authCheckMeet, (req, res) => {
    // console.log(req.session.meet_name);
    let roomid = req.params.roomid;
    let roomName = req.session.meet_name;

    res.header(
        "Cache-Control",
        "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );

    room_history.countDocuments(
        {
            room_id: roomid,
        },
        function (err, count) {
            if (!count) {
                const newMeet = new room_history({
                    room_id: roomid,
                    meet_name: req.session.meet_name,
                    user_id: req.user.googleId,
                    chats: [
                        {
                            senders_name: req.user.name,
                            message: req.user.name + " Joined",
                            time: Date.now(),
                        },
                    ],
                });
                // console.log(newMeet);
                newMeet.save();
            }
        }
    );

    room_history.findOne({ room_id: roomid }).exec()
        .then(x => {
            console.log("BYE" + x);
            if (x != null) { roomName = x.meet_name; console.log("BYE" + x.meet_name); }

        }).catch(err => { })
        .finally(() => {
            console.log(roomName);
            res.render("home_app", {
                user: req.user.name,
                mail: req.user.emailId,
                roomname: roomName,
                image: req.user.photo,
                googleId: req.user.googleId,
                roomid: roomid,
                appname: process.env.APPNAME,
            })
        })

});

// ! HOME PAGE - SENDING
router.get("/", (req, res) => {
    res.render("home", { appname: process.env.APPNAME });
});

module.exports = router