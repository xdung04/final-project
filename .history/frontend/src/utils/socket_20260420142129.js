import { io } from "socket.io-client";

const socket = io("http://127.0.0.1", {
  transports: ["websocket"], // tránh fallback polling
});

export default socket;