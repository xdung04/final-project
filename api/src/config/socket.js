import { Server } from "socket.io";
import * as chatLiveService from "../services/chatLiveService.js";

let ioInstance;

/**
 * ✅ FIXED: Tạo room riêng cho mỗi chi nhánh (thanh toán, checkout)
 * 
 * Room naming convention:
 * - checkout_branch_${idBranch} → Phòng thanh toán của chi nhánh
 * - chat_conv_${conversationId} → Phòng chat của conversation
 */
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

    // ✅ BƯỚC 1: Lễ tân join vào phòng thanh toán của chi nhánh
    socket.on("receptionist_join_checkout", ({ idBranch, receptionistId }) => {
      if (!idBranch) return;
      const checkoutRoomId = `checkout_branch_${idBranch}`;
      socket.join(checkoutRoomId);
      console.log(`👤 Lễ tân [${receptionistId}] joined checkout room: ${checkoutRoomId}`);
    });

    // ✅ BƯỚC 2: iPad join vào phòng thanh toán của chi nhánh
    socket.on("ipad_join_checkout", ({ idBranch, ipadId }) => {
      if (!idBranch) return;
      const checkoutRoomId = `checkout_branch_${idBranch}`;
      socket.join(checkoutRoomId);
      console.log(`📱 iPad [${ipadId}] joined checkout room: ${checkoutRoomId}`);
    });

    // ✅ BƯỚC 3: Lễ tân push bill → emit chỉ tới ROOM (không broadcast)
    socket.on("admin_push_checkout", (data) => {
      const checkoutRoomId = `checkout_branch_${data.idBranch}`; // ✅ Lấy từ data
      
      if (!checkoutRoomId) {
        console.error("❌ Missing idBranch in admin_push_checkout");
        return;
      }

      console.log(`👉 Lễ tân đẩy bill [${data.bookingId}] tới room: ${checkoutRoomId}`);
      
      // ✅ Emit chỉ tới room, không phải broadcast
      io.to(checkoutRoomId).emit("receive_checkout_request", {
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // ✅ BƯỚC 4: Lễ tân hủy checkout → emit tới ROOM
    socket.on("admin_cancel_checkout", (data) => {
      const checkoutRoomId = `checkout_branch_${data.idBranch}`; // ✅ Lấy từ data
      
      if (!checkoutRoomId) {
        console.error("❌ Missing idBranch in admin_cancel_checkout");
        return;
      }

      console.log(`❌ Lễ tân hủy yêu cầu bill [${data.bookingId}] ở room: ${checkoutRoomId}`);
      
      // ✅ Emit chỉ tới room
      io.to(checkoutRoomId).emit("receive_cancel_checkout", {
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // ✅ BƯỚC 5: Khách cập nhật progress → emit tới ROOM
    socket.on("customer_update_progress", (data) => {
      const checkoutRoomId = `checkout_branch_${data.idBranch}`;
      
      if (!checkoutRoomId) {
        console.error("❌ Missing idBranch in customer_update_progress");
        return;
      }

      console.log(`📊 Khách cập nhật tiến độ [${data.bookingId}] ở room: ${checkoutRoomId}`);
      
      io.to(checkoutRoomId).emit("receive_customer_progress", {
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // ✅ BƯỚC 6: Khách chọn thanh toán tiền mặt → emit tới ROOM
    socket.on("customer_choose_cash_payment", (data) => {
      const checkoutRoomId = `checkout_branch_${data.idBranch}`;
      
      if (!checkoutRoomId) {
        console.error("❌ Missing idBranch in customer_choose_cash_payment");
        return;
      }

      console.log(`💵 Khách yêu cầu thanh toán TIỀN MẶT - Booking: ${data.bookingId} ở room: ${checkoutRoomId}`);
      
      io.to(checkoutRoomId).emit("customer_choose_cash_payment", {
        ...data,
        step: 6,
        timestamp: new Date().toISOString(),
      });

      io.to(checkoutRoomId).emit("receive_customer_progress", {
        step: 6,
        rating: data.rating || 0,
        tip: data.tip || 0,
        total: data.total || 0,
        isCashPayment: true,
        bookingId: data.bookingId,
        timestamp: new Date().toISOString(),
      });
    });

    // ✅ Chat: Join conversation room
    socket.on("join_conversation", ({ conversationId }) => {
      if (!conversationId) return;
      const roomId = `chat_conv_${String(conversationId)}`;
      socket.join(roomId);
      console.log(`👉 [CHAT] ${socket.id} joined room: ${roomId}`);
    });

    // ✅ Chat: Leave conversation room
    socket.on("leave_conversation", ({ conversationId }) => {
      if (!conversationId) return;
      const roomId = `chat_conv_${String(conversationId)}`;
      socket.leave(roomId);
      console.log(`👋 [CHAT] ${socket.id} left room: ${roomId}`);
    });

    // ✅ Chat: Send message
    socket.on("send_message", async (msg) => {
      try {
        if (!msg?.conversationId) return;
        const roomId = `chat_conv_${String(msg.conversationId)}`;

        const convBefore = await chatLiveService.getConversationById(msg.conversationId);
        const wasClosed = convBefore?.status === "closed";

        // 1. Lưu tin nhắn vào MySQL
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

        // 2. ⚡ Phát vào ROOM chat (chỉ người trong phòng hứng)
        io.to(roomId).emit("receive_message", payload);
        console.log(`📨 [Room ${roomId}] Người gửi [${msg.senderType}]:`, payload.content);

        // 3. ⚡ Cập nhật sidebar (phát rộng cho tất cả)
        io.emit("conversation_new_message", {
          conversationId: msg.conversationId,
          lastMessage: msg.content || "",
          senderType: msg.senderType,
          clientId: msg.clientId,
        });

        // 4. ⚡ Đồng bộ danh sách hàng chờ cho lễ tân
        if (msg.senderType === "customer") {
          if (wasClosed || convBefore?.status === "waiting") {
            // ✅ Emit tới tất cả (vì cần làm mới danh sách toàn hệ thống)
            io.emit("conversation_updated");
          }
        } else if (msg.senderType === "system" && (msg.eventType === "leave" || msg.eventType === "close")) {
          console.log(`🔄 [Socket Backend] Đẩy lệnh làm mới danh sách cho lễ tân do sự kiện: ${msg.eventType}`);
          io.emit("conversation_updated");
        }

      } catch (error) {
        console.error("❌ send_message error:", error.message);
        socket.emit("message_error", { error: error.message });
      }
    });

    // ✅ Chat: Reset unread count
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