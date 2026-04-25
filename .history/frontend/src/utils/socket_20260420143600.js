import { io } from "socket.io-client";

const socket = io("http://192.168.2.28:3000", {
  transports: ["websocket"], // tránh fallback polling
});

export default socket;