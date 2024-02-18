import { Server } from "socket.io";
import { room_history } from "../models/room-history.js";
import { log } from "console";

export function initializeSocketServer(server: any) {
    const io = new Server(server);

    io.on("connection", (socket) => {
        handleJoinEvent(socket);
        handleMessageFromClientEvent(socket);
        handleSendChatMessageEvent(socket);
        handleDrawingEvent(socket);
    });

    return io;
}

function handleJoinEvent(socket: any): void {
    socket.on("join", (message: string) => {
        const data = JSON.parse(message);
        console.log("Joining room:", data.room);
        socket.join(data.room);
        socket.broadcast.to(data.room).emit("message_from_server", message);
    });
}

function handleMessageFromClientEvent(socket: any): void {
    socket.on("message_from_client", (message: string) => {
        const data = JSON.parse(message);
        // console.log("Received from client:", message);
        socket.broadcast.to(data.room).emit("message_from_server", message);
    });
}

async function handleSendChatMessageEvent(socket: any): Promise<void> {
    socket.on("send-chat-message", async (message: any) => {
        // console.log(message);
        
        try {
            const data = message;
            // const data = JSON.parse(message);
            const chatMessage = {
                senders_name: data.displayname,
                message: data.message,
                time: Date.now(),
            };
            console.log("Chat message:", chatMessage);
            await room_history.updateOne(
                { room_id: data.room },
                { $push: { chats: chatMessage } }
            );
            socket.broadcast.to(data.room).emit("chat-message", message);
        } catch (error) {
            console.error("Error sending chat message:", error);
        }
    });
}


function handleDrawingEvent(socket: any): void {
    socket.on("drawing", (data: any) =>
        socket.broadcast.to(data.room).emit("drawing", data.data)
    );
}