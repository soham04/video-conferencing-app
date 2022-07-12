const socketio = require("socket.io");
const room_history = require("./models/room-history")

// ----------------------------------------------------------------------------------------
// ! Creating a Socket.io server for handling messages
// const io = require('socket.io')(server)

module.exports = function (app) {

    let io = socketio.listen(app)

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

    return io

}

// module.exports = io

  // ----------------------------------------------------------------------------------------
