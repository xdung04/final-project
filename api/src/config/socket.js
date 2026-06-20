import { Server } from "socket.io";
import * as chatLiveService from "../services/chatLiveService.js";

let ioInstance;

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("🟢 Thiết bị mới kết nối socket:", socket.id);

    socket.on("admin_push_checkout", (data) => {
      console.log(`👉 Lễ tân đẩy bill [${data.bookingId}] sang iPad`);
      io.emit("receive_checkout_request", data);
    });

    socket.on("admin_cancel_checkout", (data) => {
      console.log(`❌ Lễ tân hủy yêu cầu bill [${data.bookingId}]`);
      io.emit("receive_cancel_checkout", data);
    });

    socket.on("customer_update_progress", (data) => {
      io.emit("receive_customer_progress", data);
    });

    socket.on("customer_choose_cash_payment", (data) => {
      console.log(`💵 Khách yêu cầu thanh toán TIỀN MẶT - Booking: ${data.bookingId}`);
      io.emit("customer_choose_cash_payment", {
        ...data,
        step: 6,
        timestamp: new Date().toISOString(),
      });
      io.emit("receive_customer_progress", {
        step: 6,
        rating: data.rating || 0,
        tip: data.tip || 0,
        total: data.total || 0,
        isCashPayment: true,
        bookingId: data.bookingId,
      });
    });

    // ✅ Ép string để đảm bảo room name nhất quán giữa Khách và Lễ tân
    socket.on("join_conversation", ({ conversationId }) => {
      if (!conversationId) return;
      const roomId = String(conversationId);
      socket.join(roomId);
      console.log(`👉 [CHAT] ${socket.id} joined room: ${roomId}`);
    });

    socket.on("leave_conversation", ({ conversationId }) => {
      if (!conversationId) return;
      const roomId = String(conversationId);
      socket.leave(roomId);
      console.log(`👋 [CHAT] ${socket.id} left room: ${roomId}`);
    });

    socket.on("send_message", async (msg) => {
      try {
        if (!msg?.conversationId) return;
        const roomId = String(msg.conversationId); // Ép chuỗi nhất quán

        const convBefore = await chatLiveService.getConversationById(msg.conversationId);
        const wasClosed = convBefore?.status === "closed";

        // 1. Lưu tin nhắn vào MySQL (Lưu đủ eventType và metadata từ Client đẩy lên)
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
          clientId: msg.clientId,
        };

        // 2. ⚡ PHÁT REALTIME VÀO ROOM CHAT (Cả Khách và Lễ tân trong phòng cùng hứng)
        io.to(roomId).emit("receive_message", payload);
        console.log(`📨 [Room ${roomId}] Người gửi [${msg.senderType}]:`, payload.content);

        // 3. ⚡ CẬP NHẬT THANH SIDEBAR (Tin nhắn cuối + Đếm số tin chưa đọc)
        io.emit("conversation_new_message", {
          conversationId: msg.conversationId,
          lastMessage: msg.content || "",
          senderType: msg.senderType,
          clientId: msg.clientId,
        });

        // 4. ⚡ ĐỒNG BỘ ĐỔI TAB / REFRESH DANH SÁCH TOÀN HỆ THỐNG LỄ TÂN
        if (msg.senderType === "customer") {
          // Khách nhắn tin lúc phòng đang đợi hoặc từ phòng cũ đã đóng -> Báo Lễ tân tải lại danh sách hàng chờ
          if (wasClosed || convBefore?.status === "waiting") {
            io.emit("conversation_updated");
          }
        } 
        // 🌟 VÁ LỖI TẠI ĐÂY: Nếu là tin nhắn SYSTEM (Do Lễ tân kích hoạt nút Rời hoặc Đóng từ Client)
        else if (msg.senderType === "system" && (msg.eventType === "leave" || msg.eventType === "close")) {
          console.log(`🔄 [Socket Backend] Đẩy lệnh làm mới danh sách công khai cho Lễ tân do sự kiện: ${msg.eventType}`);
          io.emit("conversation_updated");
        }

      } catch (error) {
        console.error("❌ send_message error:", error.message);
        socket.emit("message_error", { error: error.message });
      }
    });

    socket.on("reset_unread", async ({ conversationId, receptionistId }) => {
      await chatLiveService.resetUnreadCount(conversationId, receptionistId);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Thiết bị ngắt kết nối socket:", socket.id);
    });
  });

  return io;
};

export const getIO = () => ioInstance;
export default initSocket;