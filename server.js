require("dotenv").config();
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const bodyParser = require("body-parser");
const io = require("socket.io")(server);
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("./passport");
const mongoose = require("mongoose");
const cookieSession = require("cookie-session");
const User = require("./models/user")
const room_history = require("./models/room-history")

app.set("view engine", "ejs");
app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000, // in milliseconds value = 1 day
    keys: ["cokiekey"],
  })
);
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());
app.use(require("./routes"))

async function main() {
  await mongoose.connect(process.env.MONGO_DB_LINK);
  console.log("Connected to mongoDB");
}

main().catch((err) => console.log(err));

// ----------------------------------------------------------------------------------------
// ! Creating a Socket.io server for handling messages
// const io = require('socket.io')(server)

io.on("connection", (socket) => {
  socket.on("join", (message) => {
    // ! "JOIN"
    let tmp = JSON.parse(message);

    console.log(tmp.room);
    socket.join(tmp.room);

    if (message.length < 150) console.log("<- Received: %s", message);
    else {
      console.log("<- Received: %s", message.slice(0, 50));
    }

    console.log("boradcasting to room :" + tmp.room);
    socket.broadcast.to(tmp.room).emit("message_from_server", message);
  });

  socket.on("message_from_client", (message) => {
    let tmp = JSON.parse(message);

    if (message.length < 150) console.log("<- Received: %s", message);
    else {
      console.log("<- Received: %s", message.slice(0, 50));
    }
    console.log("boradcasting to room :") + tmp.room;
    socket.broadcast.to(tmp.room).emit("message_from_server", message);
  });

  socket.on("send-chat-message", (message) => {
    // ! "GROUP CHAT"
    // let tmp = JSON.parse(message)
    let tmp_obj = {
      senders_name: message.displayname,
      message: message.message,
      time: Date.now(),
    };
    console.log(tmp_obj);
    // let tmp_obj = { senders_name: message.displayname, message: message.message, time: Date.now() }

    room_history.updateOne(
      {
        room_id: message.room,
      },
      {
        $push: {
          chats: tmp_obj,
        },
      },
      function (err, docs) {
        if (err) {
          console.log(err);
        } else {
          console.log("Updated Docs : ", docs);
        }
      }
    );

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

    let tmp = message;
    console.log("-----" + message);
    socket.broadcast.to(tmp.room).emit("chat-message", message);
  });

  socket.on("drawing", (data) =>
    socket.broadcast.to(data.room).emit("drawing", data.data)
  );
});

// ----------------------------------------------------------------------------------------

// ! LISTENING ON THE PORT FOR REQUESTS
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Express server listening on port ${port} | GOTO http://localhost:3000/`);
});
