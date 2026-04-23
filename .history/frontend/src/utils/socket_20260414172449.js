import { io } from "socket.io-client";

const socket = io("http://192.168.1.147:8088", {
  transports: ["websocket"],
  reconnection: true,          // 🔥 tự reconnect
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
});

export default socket;