// src/services/chatFlowService.js
import { processBrainLoop } from "./brainService.js";
import {
  getTodayChatHistory,
  saveChatMessage,
  deleteChatHistory,
  getBookingState,
  saveBookingState,
  deleteBookingState,
} from "./chatService.js";
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

    // Đảm bảo cấu trúc mảng dịch vụ luôn chuẩn
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
export async function processChatFlow({ sessionId, message, customerId }) {

  // ══════════════════════════════════════════════
  // LOGGED-IN FLOW
  // ══════════════════════════════════════════════
  if (customerId) {
    console.log(`➡️ [BrainService] Khách hàng ${customerId} gửi tin nhắn.`);

    let conversation = await Conversation.findOne({ where: { customerId } });

    // Nếu conversation đã đóng → mở lại
    if (conversation?.status === "closed") {
      await conversation.update({ status: "waiting", mode: "ai", bookingState: null });
      await conversation.reload();
    }

    // Nếu lễ tân đang xử lý → không để AI trả lời
    if (conversation?.status === "in_progress") {
      await saveMessage({
        conversationId: conversation.id,
        senderType: "customer",
        senderId: customerId,
        content: message,
      });
      return { reply: "", needReceptionist: true };
    }

    // Parse bookingState từ DB
    const bookingState = parseBookingState(conversation?.bookingState);

    // Lấy lịch sử hội thoại
    const history = conversation
      ? (await getConversationHistory(conversation.id, 10)).messages.map((m) => ({
          role: m.senderType === "customer" ? "user" : "assistant",
          content: m.content,
        }))
      : [];

    // ── Gọi Brain Loop ──
    // ← SỬA: destructure thêm needReceptionist
    const { reply, newBookingState, needLogin, needReceptionist } = await processBrainLoop({
      message,
      bookingState,
      history,
      isLoggedIn: true,
      customerId,
    });

    // Persist conversation + state mới
    if (conversation) {
      await conversation.update({ bookingState: JSON.stringify(newBookingState) });
    } else {
      conversation = await Conversation.create({
        customerId,
        mode: "ai",
        status: "waiting",
        bookingState: JSON.stringify(newBookingState),
      });
    }

    // Lưu tin nhắn và emit socket
    await saveMessage({ conversationId: conversation.id, senderType: "customer", senderId: customerId, content: message });
    await saveMessage({ conversationId: conversation.id, senderType: "ai", content: reply });

    const io = getIO();
    if (io) {
      io.to(String(conversation.id)).emit("receive_message", {
        conversationId: conversation.id,
        senderType: "ai",
        content: reply,
      });
    }

    // Dọn dẹp state sau khi đặt lịch thành công
    if (newBookingState.bookingCompleted) {
      await conversation.update({ bookingState: null });
      console.log(`✅ Đặt lịch thành công -> Đã dọn dẹp state`);
    }

    // ← SỬA: forward needReceptionist ra ngoài để controller trả về frontend
    return {
      reply,
      conversationId: conversation.id,
      ...(needReceptionist && { needReceptionist: true }),
    };
  }

  // ══════════════════════════════════════════════
  // GUEST FLOW (chưa đăng nhập)
  // ══════════════════════════════════════════════
  else {
    const [history, rawGuestState] = await Promise.all([
      getTodayChatHistory(sessionId),
      getBookingState(sessionId),
    ]);

    // Parse guestState từ Redis, fallback về default nếu chưa có
    const guestState = rawGuestState
      ? parseBookingState(rawGuestState)
      : createDefaultBookingState();

    // ── Gọi Brain Loop ──
    const { reply, newBookingState, needLogin } = await processBrainLoop({
      message,
      bookingState: guestState,
      history: history.map((h) => ({ role: h.role, content: h.content })),
      isLoggedIn: false,
      customerId: null,
    });

    // Lưu lịch sử chat và state song song
    await Promise.all([
      saveChatMessage(sessionId, { role: "user", content: message }),
      saveChatMessage(sessionId, { role: "assistant", content: reply }),
      // bookingCompleted → saveBookingState(null) tự xóa key Redis
      saveBookingState(sessionId, newBookingState.bookingCompleted ? null : newBookingState),
    ]);

    // Trả needLogin nếu brainService chặn do chưa đăng nhập
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
// (Tách biệt với transferToReceptionist tool trong brainService)
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
    { where: { customerId, status: ["waiting", "in_progress"] } }
  );
  if (updatedCount > 0) {
    const io = getIO();
    if (io) io.emit("conversation_updated");
  }
  return { success: true, closedRooms: updatedCount };
}