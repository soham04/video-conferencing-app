const mongoose = require("mongoose");

const room_history_schema = new mongoose.Schema({
    room_id: {
        type: String,
    },
    user_id: {
        type: String,
    },
    time: {
        type: Date,
        default: Date.now,
    },
    chats: {
        type: [
            {
                senders_name: String,
                message: String,
                time: Date,
            },
        ],
        default: [],
    },
});

const room_history = mongoose.model("room_history", room_history_schema);

module.exports = room_history