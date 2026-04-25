// file: config/socket.js
import { Server } from "socket.io";
import * as chatLiveService from "../services/chatLiveService.js";
const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Thiết bị mới kết nối socket:", socket.id);

    // =====================================================
    // LUỒNG 1: LỄ TÂN → KHÁCH HÀNG (iPad/Kiosk)
    // =====================================================

    socket.on("admin_push_checkout", (data) => {
      console.log(`👉 Lễ tân đẩy bill [${data.bookingId}] sang iPad`);
      io.emit("receive_checkout_request", data);
    });

    socket.on("admin_cancel_checkout", (data) => {
      console.log(`❌ Lễ tân hủy yêu cầu bill [${data.bookingId}]`);
      io.emit("receive_cancel_checkout", data);
    });

    // =====================================================
    // LUỒNG 2: KHÁCH HÀNG (iPad) → LỄ TÂN (Monitoring)
    // =====================================================

    // Tiến độ thông thường (Rating, Tip, Invoice...)
    socket.on("customer_update_progress", (data) => {
      io.emit("receive_customer_progress", data);
    });

    // ==================== MỚI: THANH TOÁN TIỀN MẶT ====================
    socket.on("customer_choose_cash_payment", (data) => {
      console.log(
        `💵 Khách yêu cầu thanh toán TIỀN MẶT - Booking: ${data.bookingId} | Tổng: ${data.total}đ`,
      );

      // Gửi thông tin chi tiết cho màn hình lễ tân
      io.emit("customer_choose_cash_payment", {
        ...data,
        step: 6, // Bước đặc biệt cho tiền mặt
        timestamp: new Date().toISOString(),
      });

      // (Tùy chọn) Đồng thời cập nhật luôn progress chung để MonitoringView nhận được
      io.emit("receive_customer_progress", {
        step: 6,
        rating: data.rating || 0,
        tip: data.tip || 0,
        total: data.total || 0,
        isCashPayment: true,
        bookingId: data.bookingId,
      });
    });

    socket.on("join_conversation", ({ conversationId }) => {
      if (!conversationId) return;

      socket.join(conversationId);
      console.log(
        `👉 [CHAT] ${socket.id} joined conversation: ${conversationId}`,
      );
    });

    socket.on("send_message", async (msg) => {
      try {
        if (!msg?.conversationId) return;

        // ✅ 1. Lưu DB
        const savedMessage = await chatLiveService.saveMessage({
          conversationId: msg.conversationId,
          senderType: msg.senderType,
          senderId: msg.senderId,
          messageType: msg.messageType || "text",
          content: msg.content,
          eventType: msg.eventType,
          metadata: msg.metadata,
        });

        const payload = {
          ...msg,
          id: savedMessage.id,
          createdAt: savedMessage.createdAt,
          clientId: msg.clientId, // 🔥 QUAN TRỌNG
        };

        // ✅ 2. Emit cho tất cả (kể cả sender cũng OK)
        io.to(msg.conversationId).emit("receive_message", payload);
      } catch (error) {
        socket.emit("message_error", { error: error.message });
      }
    });

    // =====================================================
    socket.on("disconnect", () => {
      console.log("🔴 Thiết bị ngắt kết nối socket:", socket.id);
    });
  });

  return io;
};

export default initSocket;
