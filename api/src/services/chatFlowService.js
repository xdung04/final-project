// src/services/chatFlowService.js
import { processBrainLoop } from "./brainService.js";
import {
  getChatHistory,
  saveChatMessage,
  deleteChatHistory,
  getBookingState,
  saveBookingState,
  deleteBookingState,
} from "./chatCacheService.js";
import db from "../models/index.js";
import { saveMessage, getConversationHistory } from "./chatLiveService.js";
import { getIO } from "../config/socket.js";

const { Conversation } = db;

// ─────────────────────────────────────────────────────────────
// createDefaultBookingState
// ─────────────────────────────────────────────────────────────
const createDefaultBookingState = () => ({
  idBranch: null,
  branchName: null,
  idBarber: null,
  barberName: null,
  bookingDate: null,
  slotTime: null,
  idServices: [],
  serviceNames: [],
  bookingCompleted: false,
});

// ─────────────────────────────────────────────────────────────
// parseBookingState — đọc và parse state an toàn từ DB
// ─────────────────────────────────────────────────────────────
function parseBookingState(raw) {
  const defaults = createDefaultBookingState();
  if (!raw) return defaults;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object") return defaults;

    const state = { ...defaults, ...parsed };
    if (!Array.isArray(state.idServices)) {
      state.idServices = state.idService ? [state.idService] : [];
    }
    if (!Array.isArray(state.serviceNames)) {
      state.serviceNames = state.serviceName ? [state.serviceName] : [];
    }
    return state;
  } catch (e) {
    console.error("❌ Lỗi parse bookingState, reset về mặc định:", e);
    return defaults;
  }
}

// ─────────────────────────────────────────────────────────────
// processChatFlow — Entry point chính
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// processChatFlow — Entry point chính
// ─────────────────────────────────────────────────────────────
export async function processChatFlow({ sessionId, message, customerId }) {

  const isStrictLoggedIn = customerId && 
                           customerId !== "null" && 
                           customerId !== "undefined" && 
                           customerId !== "";

  // ══════════════════════════════════════════════
  // LOGGED-IN FLOW
  // ══════════════════════════════════════════════
  if (isStrictLoggedIn) {
    console.log(`➡️ [BrainService] Khách hàng ${customerId} gửi tin nhắn.`);

    let conversation = await Conversation.findOne({ where: { customerId } });

    if (conversation?.status === "closed") {
      await conversation.update({ status: "ai_active", mode: "ai", bookingState: null });
      await conversation.reload();
    }

    if (conversation?.status === "in_progress") {
      await saveMessage({
        conversationId: conversation.id,
        senderType: "customer",
        senderId: customerId,
        content: message,
      });
      return { reply: "", needReceptionist: true };
    }

    const bookingState = parseBookingState(conversation?.bookingState);

    // ✅ FIX: Đảm bảo history luôn là array
    let history = [];
    if (conversation) {
      const historyData = await getConversationHistory(conversation.id, 10);
      
      // ✅ Kiểm tra type an toàn
      if (historyData) {
        const messages = Array.isArray(historyData) 
          ? historyData 
          : (historyData.messages && Array.isArray(historyData.messages) 
              ? historyData.messages 
              : []);
        
        history = messages.map((m) => ({
          role: m.senderType === "customer" ? "user" : "assistant",
          content: m.content,
        }));
      }
    }

    const { reply, newBookingState, needLogin, needReceptionist } = await processBrainLoop({
      message,
      bookingState,
      history,
      isLoggedIn: true,
      customerId,
    });

    if (conversation) {
      await conversation.update({ bookingState: newBookingState });
    } else {
      conversation = await Conversation.create({
  customerId,
  mode: "ai",
  status: "ai_active",
  bookingState: newBookingState,
});
    }

    await saveMessage({ conversationId: conversation.id, senderType: "customer", senderId: customerId, content: message });
    await saveMessage({ conversationId: conversation.id, senderType: "ai", content: reply });

    if (newBookingState.bookingCompleted) {
      await conversation.update({ bookingState: null });
      console.log(`✅ Đặt lịch thành công -> Đã dọn dẹp state`);
    }

    return {
      reply,
      conversationId: conversation.id,
      ...(needReceptionist && { needReceptionist: true }),
    };
  }

  // ══════════════════════════════════════════════
  // GUEST FLOW 
  // ══════════════════════════════════════════════
  else {
    console.log(`➡️ [BrainService] Khách vãng lai gửi tin nhắn (Session: ${sessionId}).`);
    
    const [historyData, rawGuestState] = await Promise.all([
      getChatHistory(sessionId),
      getBookingState(sessionId),
    ]);

    // ✅ Đảm bảo history luôn là array
    const history = Array.isArray(historyData) ? historyData : [];

    const guestState = rawGuestState
      ? parseBookingState(rawGuestState)
      : createDefaultBookingState();

    const { reply, newBookingState, needLogin } = await processBrainLoop({
      message,
      bookingState: guestState,
      history: history.map((h) => ({ role: h.role, content: h.content })), // ✅ Giờ history chắc chắn là array
      isLoggedIn: false,
      customerId: null,
    });

    await Promise.all([
      saveChatMessage(sessionId, { role: "user", content: message }),
      saveChatMessage(sessionId, { role: "assistant", content: reply }),
      saveBookingState(sessionId, newBookingState.bookingCompleted ? null : newBookingState),
    ]);

    return { reply, ...(needLogin && { needLogin: true }) };
  }
}

// ─────────────────────────────────────────────────────────────
// syncPostLogin — Dọn dẹp sau khi Guest đăng nhập thành công
// ─────────────────────────────────────────────────────────────
export async function syncPostLogin({ sessionId }) {
  try {
    await Promise.all([
      deleteChatHistory(sessionId),
      deleteBookingState(sessionId),
    ]);
    return { success: true };
  } catch (error) {
    console.error("Lỗi syncPostLogin:", error.message);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// requestHumanSupport — Yêu cầu kết nối lễ tân từ UI button
// (ĐÂY là nơi DUY NHẤT chuyển conversation sang "waiting")
// ─────────────────────────────────────────────────────────────
export async function requestHumanSupport({ customerId }) {
  if (!customerId) throw new Error("Thiếu customerId");
  try {
    const [conversation, created] = await Conversation.findOrCreate({
      where: { customerId },
      defaults: { mode: "human", status: "waiting", unreadCount: 0, bookingState: null },
    });
    if (!created) {
      await conversation.update({ mode: "human", status: "waiting", unreadCount: 0 });
    }
    const io = getIO();
    if (io) {
      io.emit("conversation_updated");
      io.emit("conversation_closed", { conversationId: conversation.id });
      io.emit("conversation_new_message", {
        conversationId: conversation.id,
        lastMessage: "⚠️ Khách hàng đang yêu cầu kết nối với Lễ tân...",
        senderType: "system",
        clientId: `req_human_${Date.now()}`,
      });
    }
    return { success: true, conversationId: conversation.id, status: "waiting" };
  } catch (err) {
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// closeConversationOnLogout — Đóng conversation khi logout
// ─────────────────────────────────────────────────────────────
export async function closeConversationOnLogout({ customerId }) {
  if (!customerId) throw new Error("Thiếu customerId");
  const [updatedCount] = await Conversation.update(
    { status: "closed" },
    { where: { customerId, status: ["ai_active", "waiting", "in_progress"] } }
  );
  if (updatedCount > 0) {
    const io = getIO();
    if (io) io.emit("conversation_updated");
  }
  return { success: true, closedRooms: updatedCount };
}