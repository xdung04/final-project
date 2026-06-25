import { io } from "socket.io-client";

const socket = io("http://192.168.2.166:8088", {
});

export default socket;