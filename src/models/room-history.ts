import pkg from 'mongoose';
const { Schema, model } = pkg;

const room_history_schema = new Schema({
    room_id: {
        type: String,
    },
    meet_name: {
        type: String,
        required: true,
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

export const room_history = model("room_history", room_history_schema);
