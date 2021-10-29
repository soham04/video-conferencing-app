require('dotenv').config()
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const bodyParser = require("body-parser");
const io = require('socket.io')(server)
const ejs = require("ejs");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var session = require('express-session')
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
var findOrCreate = require('mongoose-findorcreate')
const mongoose = require('mongoose');
const cookieSession = require('cookie-session')
// const { v4: uuidv4 } = require('uuid');

app.set('view engine', 'ejs');

app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000, // in milliseconds 
    keys: ["cokiekey"]
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize())
app.use(passport.session())

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(process.env.MONGO_DB_LINK);
    console.log("Connected to mongoDB");
}

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    googleId: String,
    emailId: String,
    photo: String
});

const User = mongoose.model('user', userSchema);

passport.serializeUser(function (User, done) {
    done(null, User.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
        done(null, user);
    });
});

passport.use(

    new GoogleStrategy({
        clientID: process.env.clientID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://evening-anchorage-97986.herokuapp.com/auth/google/callback",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
        function (accessToken, refreshToken, profile, done) {
            console.log('passport callback function fired:');
            console.log(profile);
            // check if the user already exists in our DB

            User.findOne({ googleId: profile.id }).then((currentUser) => {
                if (currentUser) {
                    // already have the user
                    console.log("User already made");
                    console.log(currentUser);

                    done(null, currentUser)
                } else {
                    // if not create the user in our db
                    console.log("Creating new user");
                    console.log(currentUser);

                    new User({
                        name: profile.displayName,
                        googleId: profile.id,
                        emailId: profile.emails[0].value,
                        photo: profile.photos[0].value
                    }).save().then((newUser) => {
                        console.log('new user created: ', newUser)
                    })

                    done(null, currentUser)
                }
            })
        }
    ));

// ! AUTH CHECK | LANDING

const authCheck = (req, res, next) => {
    console.log("Currect user" + req.user);
    if (req.user) {
        res.redirect('/dash');
    } else {
        next();
    }
};

// ! HOME PAGE

app.get('/', authCheck, (req, res) => {
    res.render("home", {})
});

// ! AUTH CHECK | DIRECT VIDEO CONFERENCE

const authCheck2 = (req, res, next) => {
    console.log("Currect user" + req.user);
    if (req.user) {
        next();
    } else {
        res.redirect('/')
    }
};

// ! VIDEO CONFERNCE PAGE
const room_history_schema = new mongoose.Schema({
    room_id: { type: String },
    user_id: { type: String },
    time: { type: Date, default: Date.now },
    chats: {
        type: [{
            senders_name: String,
            message: String,
            time: Date
        }], default: []
    }
});

const room_history = mongoose.model('room_history', room_history_schema);

app.get('/dash', authCheck2, (req, res) => {
    console.log("HERE USER : ");
    console.log(req.user);
    console.log(typeof (req));
    console.log(req.user.name);
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    // res.render("home_app", { user: req.user.name, mail: req.user.emailId, image: req.user.photo, googleId: req.user.googleId })
    // let query = room_history.find({ user_id: req.user.googleId })
    // let room_history = query.getFilter()
    let room_hist
    // res.send("i")
    room_history.find({ user_id: req.user.googleId }, function (err, docs) {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Second function call : ", docs);
            // room_hist = JSON.stringify(docs)
            room_hist = docs
            console.log(room_hist);
            res.render("dash", { user: req.user.name, mail: req.user.emailId, image: req.user.photo, googleId: req.user.googleId, room_hist: room_hist })
        }
    });
    // console.log(room_hist);


});

// ! GOOGLE AUTH ROUTE

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email', 'openid'] }) // redirect to google singIn
);

// ! GOOGLE AUTH ROUTE CALLBACK

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/failed_login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        console.log("Successful authentication of user : \n" + req.user);
        console.log("Redirecting to /old");
        res.redirect('/dash');
    });

// ! FAILED LOGIN

app.get('/failed_login', (req, res) => {
    // console.log(req);
    res.send("login fail")
})

// ! LOGED OUT

app.get('/logout', function (req, res) {
    req.logout();
    res.send("LOGED OUT");
});

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

app.get("/makenew", (req, res) => {
    let roomid = uuidv4()
    res.redirect("room/" + roomid)
})


app.get("/room/:roomid", (req, res) => {
    let roomid = req.params.roomid
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');

    room_history.countDocuments({ room_id: roomid }, function (err, count) {
        if (count > 0) {
            //document exists });
        } else {
            const newMeet = new room_history({
                room_id: roomid,
                user_id: req.user.googleId,
                chats: [{ "senders_name": req.user.name, "message": req.user.name + " Joined", "time": Date.now() }]
            });
            newMeet.save()
        }
    });

    res.render("home_app", { user: req.user.name, mail: req.user.emailId, image: req.user.photo, googleId: req.user.googleId, roomid: roomid })

})










































// const express = require('express')
// const app = express()
// const server = require('http').createServer(app)
// const bodyParser = require("body-parser");

// app.set('view engine', 'ejs');

// app.use(bodyParser.urlencoded({ extended: true }));

// app.use(express.static("public"));

// ----------------------------------------------------------------------------------------
// ! HOME PAGE - SENDING
app.get('/', (req, res) => {
    res.render("home")
})

// ! Creating a Socket.io server for handling messages
// const io = require('socket.io')(server)

io.on('connection', (socket) => {

    socket.on("join", (message) => {   // ! "JOIN"
        let tmp = JSON.parse(message)

        console.log(tmp.room);
        socket.join(tmp.room)

        if (message.length < 150)
            console.log('<- Received: %s', message);
        else {
            console.log('<- Received: %s', message.slice(0, 50));
        }

        console.log("boradcasting to room :" + tmp.room);
        socket.broadcast.to(tmp.room).emit("message_from_server", message)
    })

    socket.on("message_from_client", (message) => {
        let tmp = JSON.parse(message)

        if (message.length < 150)
            console.log('<- Received: %s', message);
        else {
            console.log('<- Received: %s', message.slice(0, 50));
        }
        console.log("boradcasting to room :") + tmp.room;
        socket.broadcast.to(tmp.room).emit("message_from_server", message)
    })

    socket.on('send-chat-message', message => { // ! "GROUP CHAT"
        // let tmp = JSON.parse(message)
        let tmp_obj = { senders_name: message.displayname, message: message.message, time: Date.now() }
        console.log(tmp_obj);
        // let tmp_obj = { senders_name: message.displayname, message: message.message, time: Date.now() }

        room_history.updateOne(
            { room_id: message.room },
            { $push: { chats: tmp_obj } }
        );
        room_history.update(
            { room_id: message.room },
            {
                $push: {
                    chats: {
                        $each: [tmp_obj],
                        $sort: { time: -1 },
                        $slice: 3
                    }
                }
            }
        )

        // room_history.update(
        //     { "room_id": message.room },
        //     {
        //         $push: {
        //             "chats": {
        //                 $each: [{ "senders_name": message.displayname, "message": message.message, "time": Date.now() }],
        //                 $sort: { time: 1 }
        //             }
        //         }
        //     }
        // )

        let tmp = message
        console.log("-----" + message);
        socket.broadcast.to(tmp.room).emit('chat-message', message)
    })

    socket.on('drawing', (data) => socket.broadcast.to(data.room).emit('drawing', data.data))
})

console.log('Server running.');

// ----------------------------------------------------------------------------------------

// ! LISTENING ON THE PORT FOR REQUESTS
const port = process.env.PORT || 3000
server.listen(port, () => {
    console.log(`Express server listening on port ${port}`)
})
