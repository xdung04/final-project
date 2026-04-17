import { io } from "socket.io-client";

const socket = io("http://192.168.1.147:8088", {
  transports: ["websocket"], // tránh fallback polling
});

export default socket;