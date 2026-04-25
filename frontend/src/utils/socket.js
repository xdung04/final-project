import { io } from "socket.io-client";

const socket = io("http://localhost:8088", {
});

export default socket;