
import { io } from "socket.io-client";

const socket = io("http://192.168.1.147:3000"); // sửa IP của bạn

export default socket;