// file: config/socket.js
import { Server } from "socket.io";

const initSocket = (server) => {
  // Khởi tạo io
  const io = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"]
    }
  });

  // Gom toàn bộ logic lắng nghe vào đây
  io.on("connection", (socket) => {
    console.log("🟢 Thiết bị mới kết nối socket:", socket.id);

    // Xử lý gửi/nhận cho thanh toán Kiosk
    socket.on("admin_push_checkout", (data) => {
      console.log("👉 Nhận lệnh đẩy bill sang iPad:", data.bookingId);
      io.emit("receive_checkout_request", data);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Thiết bị ngắt kết nối socket");
    });
  });

  return io; // Trả về io lỡ sau này cần dùng ở file khác
};

export default initSocket;