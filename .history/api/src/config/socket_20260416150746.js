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

    // ----------------------------------------------------
    // LUỒNG 1: LỄ TÂN -> KHÁCH HÀNG (IPAD)
    // ----------------------------------------------------
    
    // Lễ tân đẩy bill sang iPad
    socket.on("admin_push_checkout", (data) => {
      console.log(`👉 Lễ tân đẩy bill [${data.bookingId}] sang iPad`);
      // Bắn sự kiện cho iPad nhận
      io.emit("receive_checkout_request", data);
    });

    // Lễ tân hủy/rút lại bill (iPad treo hoặc khách đổi ý)
    socket.on("admin_cancel_checkout", (data) => {
      console.log(`❌ Lễ tân hủy yêu cầu bill [${data.bookingId}]`);
      // Bắn lệnh bảo iPad quay về màn hình chờ
      io.emit("receive_cancel_checkout", data);
    });


    // ----------------------------------------------------
    // LUỒNG 2: KHÁCH HÀNG (IPAD) -> LỄ TÂN (MONITORING)
    // ----------------------------------------------------
    
    // iPad báo cáo liên tục tiến độ (Rating, Tip...) về cho lễ tân xem Live
    socket.on("customer_update_progress", (data) => {
      // console.log(`🔄 Khách đang ở bước ${data.step} - Rating: ${data.rating} - Tip: ${data.tip}`);
      // Bắn ngược lại cho màn hình lễ tân cập nhật UI
      io.emit("receive_customer_progress", data);
    });


    // Ngắt kết nối
    socket.on("disconnect", () => {
      console.log("🔴 Thiết bị ngắt kết nối socket:", socket.id);
    });
  });

  return io; // Trả về io lỡ sau này cần dùng ở file khác
};

export default initSocket;