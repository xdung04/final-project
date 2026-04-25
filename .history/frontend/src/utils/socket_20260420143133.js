import { io } from "socket.io-client";

const socket = io("http:/localhost:8088", {
  transports: ["websocket"], // tránh fallback polling
});

export default socket;