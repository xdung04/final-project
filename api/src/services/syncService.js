import db from "../models/index.js";

// 💡 Đảm bảo import đúng 2 hàm này từ file service Redis của mày
import { getTodayChatHistory, deleteChatHistory } from "./chatCacheService.js.js"; 

const { Conversation, Message } = db;

/**
 * 🔥 Hàm chính: Đồng bộ dữ liệu từ Redis xuống DB bằng Transaction (Đã sửa lỗi Validation)
 */
export const syncGuestChatToDB = async (sessionId, customerId) => {
  try {
    // 1. Lấy lịch sử chat nóng của ngày hôm nay từ Redis lên
    const todayHistory = await getTodayChatHistory(sessionId);

    // 2. Kích hoạt Database Transaction của Sequelize
// 2. Kích hoạt Database Transaction của Sequelize
return await db.sequelize.transaction(async (t) => {
  
  // ➡️ Bước A: Xác định tin nhắn cuối cùng để lưu vào phòng chat
  let lastMsgText = "📢 Yêu cầu gặp lễ tân";
  if (todayHistory && todayHistory.length > 0) {
    lastMsgText = todayHistory[todayHistory.length - 1].content || "📷 [Hình ảnh]";
  }

  // ➡️ Bước B: 🚀 ĐỔI THÀNH LUỒNG "TÌM HOẶC TẠO" ĐỂ TRÁNH LỖI UNIQUE
  const [conversation, created] = await Conversation.findOrCreate({
    where: { customerId: customerId }, // Tìm xem đã từng có phòng chat nào của khách này chưa
    defaults: {
      // Nếu CHƯA CÓ, sẽ tạo mới với đống dữ liệu này
      mode: "ai",         
      status: "waiting",   
      lastMessage: lastMsgText,
      unreadCount: 1       
    },
    transaction: t
  });

  // Nếu PHÒNG ĐÃ TỒN TẠI TỪ TRƯỚC (created === false), tiến hành cập nhật lại trạng thái để "mở lại phòng"
  if (!created) {
    await conversation.update({
      mode: "ai",         // Trả về cho AI tiếp quản tạm thời trước khi lễ tân join
      status: "waiting",   // Đẩy lại vào hàng đợi "waiting" của lễ tân
      lastMessage: lastMsgText,
      unreadCount: conversation.unreadCount + 1 // Cộng dồn tin nhắn chưa đọc
    }, { transaction: t });
  }

  const dbMessages = [];

  // (Các bước C, D, E bên dưới giữ nguyên như cũ...)
  if (!todayHistory || todayHistory.length === 0) {
    return conversation;
  }

  todayHistory.forEach((msg) => {
    if (msg.content) {
      dbMessages.push({
        conversationId: conversation.id,
        senderType: msg.role === "user" ? "customer" : "ai",
        senderId: msg.role === "user" ? customerId : null, 
        messageType: "text", 
        content: msg.content,
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date() 
      });
    }
  });

  if (dbMessages.length > 0) {
    await Message.bulkCreate(dbMessages, { transaction: t });
  }

  await deleteChatHistory(sessionId);

  return conversation;
});

  } catch (error) {
    console.error("❌ ===== DETAILED SEQUELIZE VALIDATION ERROR =====");
    console.error("Lỗi loại:", error.name);
    console.error("Thông điệp chung:", error.message);

    if (error.errors && error.errors.length > 0) {
      error.errors.forEach((err, index) => {
        console.error(`👉 Lỗi thứ ${index + 1}:`);
        console.error(`   - Thuộc tính (Cột): [${err.path}]`);
        console.error(`   - Kiểu lỗi (Type): ${err.type}`);
        console.error(`   - Lý do chi tiết (Message): ${err.message}`);
        console.error(`   - Giá trị bị chê (Value):`, err.value);
      });
    } else if (error.original) {
      console.error("👉 Lỗi gốc từ MySQL:", error.original.message);
    }
    console.error("❌ ==============================================");
    
    throw error;
  }
};