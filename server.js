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
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/callback",
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
        res.redirect('/old');
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

app.get('/old', authCheck2, (req, res) => {
    console.log("HERE USER : ");
    console.log(req.user);
    console.log(typeof (req));
    console.log(req.user.name);
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.render("index", { user: req.user.name, mail: req.user.emailId, image: req.user.photo })
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
        res.redirect('/old');
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






































// socket ------------------------------------------
io.on('connection', (socket) => {
    socket.on('join', (roomId) => {
        let selectedRoom = io.sockets.adapter.rooms[roomId]
        let numberOfClients = selectedRoom ? selectedRoom.length : 0

        // These events are emitted only to the sender socket.
        if (numberOfClients == 0) {
            console.log(`Creating room ${roomId} and emitting room_created socket event`)
            socket.join(roomId)
            socket.emit('room_created', roomId)
        } else if (numberOfClients == 1) {
            console.log(`Joining room ${roomId} Joining room ${roomId} and emitting room_joined socket event`)
            socket.join(roomId)
            socket.emit('room_joined', roomId)
        } else {
            console.log(`Can't join room ${roomId}, emitting full_room socket event`)
            socket.emit('full_room', roomId)
        }
    })

    // These events are emitted to all the sockets connected to the same room except the sender.
    socket.on('start_call', (roomId) => {
        console.log(`Broadcasting start_call event to peers in room ${roomId}`)
        socket.broadcast.to(roomId).emit('start_call')
    })
    socket.on('webrtc_offer', (event) => {
        console.log(`Broadcasting webrtc_offer event to peers in room ${event.roomId}`)
        socket.broadcast.to(event.roomId).emit('webrtc_offer', event.sdp)
    })
    socket.on('webrtc_answer', (event) => {
        console.log(`Broadcasting webrtc_answer event to peers in room ${event.roomId}`)
        socket.broadcast.to(event.roomId).emit('webrtc_answer', event.sdp)
    })
    socket.on('webrtc_ice_candidate', (event) => {
        console.log(`Broadcasting webrtc_ice_candidate event to peers in room ${event.roomId}`)
        socket.broadcast.to(event.roomId).emit('webrtc_ice_candidate', event)
    })
})

// START THE SERVER =================================================================
const port = process.env.PORT || 3000
server.listen(port, () => {
    console.log(`Express server listening on port ${port}`)
})
