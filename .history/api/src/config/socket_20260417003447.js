// file: config/socket.js
import { Server } from "socket.io";

let io; // Biến lưu trữ instance

const initSocket = (server) => {
  // Chỉ khởi tạo nếu chưa có io
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: "*", 
        methods: ["GET", "POST"]
      },
      // Thêm cái này để tránh lỗi Upgrade
      allowEIO3: true 
    });

    io.on("connection", (socket) => {
      console.log("🟢 Thiết bị mới kết nối socket:", socket.id);

      // --- Giữ nguyên các logic socket.on cũ của ông ở đây ---
      socket.on("customer_update_progress", (data) => {
        io.emit("receive_customer_progress", data);
      });
      // ... (các event khác) ...

      socket.on("disconnect", () => {
        console.log("🔴 Thiết bị ngắt kết nối socket:", socket.id);
      });
    });
  }
  return io;
};

// Hàm này để lấy io ở bất cứ đâu mà không cần truyền server
export const getIo = () => {
  if (!io) {
    throw new Error("Socket.io must be initialized first!");
  }
  return io;
};

export default initSocket;