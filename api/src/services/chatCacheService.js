import redis from "../config/redis.js";

const CHAT_PREFIX = "chat:";
const CHAT_TTL = 24 * 60 * 60; // 24 giờ giữ session tạm
const BOOKING_PREFIX = "booking:"; // ✅ prefix riêng cho booking state

export async function getChatHistory(sessionId) {
  const key = `${CHAT_PREFIX}${sessionId}`;
  const historyJson = await redis.get(key);
  return historyJson ? JSON.parse(historyJson) : [];
}

export async function getTodayChatHistory(conversationId) {
  try {
    const { Op } = await import("sequelize");
    const db = (await import("../models/index.js")).default;
    const { Message } = db;
 
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
 
    const messages = await Message.findAll({
      where: {
        conversationId,
        senderType: ["customer", "ai"],          // chỉ lấy tin của khách và AI, bỏ system
        createdAt: { [Op.gte]: startOfDay },
      },
      order: [["createdAt", "ASC"]],
      attributes: ["senderType", "content", "createdAt"],
    });
 
    if (!messages.length) {
      return "Chưa có lịch sử trò chuyện hôm nay.";
    }
 
    const lines = messages.map((m) => {
      const role = m.senderType === "customer" ? "Khách" : "AI";
      const time = new Date(m.createdAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh",
      });
      return `[${time}] ${role}: ${m.content}`;
    });
 
    return lines.join("\n");
  } catch (err) {
    console.error("❌ getTodayChatHistoryText lỗi:", err.message);
    return "Chưa có lịch sử trò chuyện hôm nay.";
  }
}

export async function saveChatMessage(sessionId, message) {
  const key = `${CHAT_PREFIX}${sessionId}`;
  const history = await getChatHistory(sessionId);

  const cleanMessage = {
    role: message.role,
    content: message.content,
    createdAt: message.createdAt || new Date().toISOString()
  };

  history.push(cleanMessage);
  await redis.set(key, JSON.stringify(history), "EX", CHAT_TTL);
}

export async function deleteChatHistory(sessionId) {
  const key = `${CHAT_PREFIX}${sessionId}`;
  await redis.del(key);
}

export async function getBookingState(sessionId) {
  const key = `${BOOKING_PREFIX}${sessionId}`;
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) : null;
}

export async function saveBookingState(sessionId, state) {
  const key = `${BOOKING_PREFIX}${sessionId}`;
  if (!state) {
    // null → xóa luôn (booking hoàn thành hoặc hủy)
    await redis.del(key);
    return;
  }
  await redis.set(key, JSON.stringify(state), "EX", CHAT_TTL);
}

// ✅ Xóa booking state (dùng khi booking hoàn thành hoặc logout)
export async function deleteBookingState(sessionId) {
  const key = `${BOOKING_PREFIX}${sessionId}`;
  await redis.del(key);
}
export async function getLoginPrompted(sessionId) {
  const val = await redis.get(`login_prompted:${sessionId}`);
  return !!val;
}

export async function setLoginPrompted(sessionId) {
  await redis.set(`login_prompted:${sessionId}`, "1", "EX", 1800);
}

export async function deleteLoginPrompted(sessionId) {
  await redis.del(`login_prompted:${sessionId}`);
}