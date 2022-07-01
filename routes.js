"use-strict"

const express = require('express');
const router = express.Router();
const passport = require('./passport');
const room_history = require("./models/room-history")

router.get(
    "/.well-known/pki-validation/2D612E6A40D7726C193A28AE10DA086F.txt",
    (req, res) => {
        res.download(__dirname + "/2D612E6A40D7726C193A28AE10DA086F.txt");
    }
);

// ! HOME PAGE
const authCheckHome = (req, res, next) => {
    console.log("Currect user" + req.user);
    if (!req.user) {
        next(); // not loggedin
    } else {
        res.redirect("/dash");   // already loggedin       
    }
};

router.get("/", authCheckHome, (req, res) => {
    // if user already loggedin, will directly go to dashboard
    // if not will go to actual home page 
    res.render("home", {});
});

// ! AUTH CHECK | DIRECT VIDEO CONFERENCE

const authCheckDash = (req, res, next) => {
    console.log("Currect user" + req.user);
    if (req.user) {
        next();
    } else {
        res.redirect("/");
    }
};

router.get("/dash", authCheckDash, (req, res) => {
    // console.log("HERE USER : ");
    console.log("USER = " + req.user);
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
    // res.send("i")
    room_history.find(
        {
            user_id: req.user.googleId,  // identification for searching user history
        },
        function (err, docs) {   // here docs id the history data
            if (err) {
                console.log("Error fetching User history = " + err);
            } else {
                console.log("Second function call : ", docs);
                // room_hist = JSON.stringify(docs)
                room_hist = docs;

                console.log(room_hist);

                res.render("dash", {    // rendering page 
                    user: req.user.name,
                    mail: req.user.emailId,
                    image: req.user.photo,
                    googleId: req.user.googleId,
                    room_hist: room_hist,
                });
            }
        }
    );
    // console.log(room_hist);
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
    let roomid = roomIdGenerate();
    res.redirect("room/" + roomid);
});

const authCheckMeet = (req, res, next) => {
    console.log("Currect user" + req.user);
    if (req.user) {
        next(); // already loggedin 
    } else {
        res.redirect("/auth/google"); // not loggedin    
    }
};

router.get("/room/:roomid", authCheckMeet, (req, res) => {
    let roomid = req.params.roomid;
    res.header(
        "Cache-Control",
        "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );

    room_history.countDocuments(
        {
            room_id: roomid,
        },
        function (err, count) {
            if (count > 0) {
                //document exists });
            } else {
                const newMeet = new room_history({
                    room_id: roomid,
                    user_id: req.user.googleId,
                    chats: [
                        {
                            senders_name: req.user.name,
                            message: req.user.name + " Joined",
                            time: Date.now(),
                        },
                    ],
                });
                newMeet.save();
            }
        }
    );

    res.render("home_app", {
        user: req.user.name,
        mail: req.user.emailId,
        image: req.user.photo,
        googleId: req.user.googleId,
        roomid: roomid,
    });
});

// ! HOME PAGE - SENDING
router.get("/", (req, res) => {
    res.render("home");
});

module.exports = router