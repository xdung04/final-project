import * as request from "~/apis/configs/httpRequest";

const CHAT_LIVE_URL = "/chat-live";

// Không còn cần truyền token làm tham số ở bất kỳ hàm nào — cookie tự gửi
// kèm nhờ withCredentials: true ở httpRequest.js.
// LƯU Ý: res trả về đã bóc .data sẵn (xem httpRequest.js), đọc thẳng res.xxx
// ở nơi gọi thay vì res.data.xxx.
const chatLiveAPI = {
  // ============ Customer APIs ============
  getOrCreateConversation: (customerId) =>
    request.get(`${CHAT_LIVE_URL}/conversation/${customerId}`),

  getHistory: (conversationId, limit = 50, offset = 0) =>
    request.get(
      `${CHAT_LIVE_URL}/history/${conversationId}?limit=${limit}&offset=${offset}`,
    ),

  closeConversation: (conversationId) =>
    request.post(`${CHAT_LIVE_URL}/close/${conversationId}`, {}),

  // ============ Receptionist APIs ============
  receptionistJoin: (conversationId, receptionistId) =>
    request.post(`${CHAT_LIVE_URL}/receptionist/join`, {
      conversationId,
      receptionistId,
    }),

  receptionistLeave: (conversationId, receptionistId) =>
    request.post(`${CHAT_LIVE_URL}/receptionist/leave`, {
      conversationId,
      receptionistId,
    }),

  transferConversation: (conversationId, fromReceptionistId, toReceptionistId) =>
    request.post(`${CHAT_LIVE_URL}/transfer`, {
      conversationId,
      fromReceptionistId,
      toReceptionistId,
    }),

  getActiveConversations: (receptionistId) =>
    request.get(
      `${CHAT_LIVE_URL}/active-conversations${receptionistId ? `?receptionistId=${receptionistId}` : ""}`,
    ),

  getWaitingConversations: () =>
    request.get(`${CHAT_LIVE_URL}/waiting-conversations`),

  getAllConversations: (status = null) =>
    request.get(
      `${CHAT_LIVE_URL}/all-conversations${status ? `?status=${status}` : ""}`,
    ),

  getAllReceptionists: () => request.get(`${CHAT_LIVE_URL}/receptionists`),

  searchConversations: (keyword = "", status = null) =>
    request.get(
      `${CHAT_LIVE_URL}/search?keyword=${encodeURIComponent(keyword)}${status ? `&status=${status}` : ""}`,
    ),
};

export default chatLiveAPI;