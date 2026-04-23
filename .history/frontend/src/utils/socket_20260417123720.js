import { io } from "socket.io-client";

const socket = io("https://resolved-climatic-tapestry.ngrok-free.dev", {
 transports: ["polling", "websocket"], // tránh fallback polling
});

export default socket;