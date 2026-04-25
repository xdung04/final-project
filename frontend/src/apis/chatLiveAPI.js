// client/src/apis/chatLiveAPI.js
import axios from "axios";

const API_URL = process.env.REACT_APP_API_BASE_URL + "/chat-live";

const chatLiveAPI = {
  // ============ Customer APIs ============
  getOrCreateConversation: (customerId, token) =>
    axios.get(`${API_URL}/conversation/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getHistory: (conversationId, token, limit = 50, offset = 0) =>
    axios.get(
      `${API_URL}/history/${conversationId}?limit=${limit}&offset=${offset}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    ),

  closeConversation: (conversationId, token) =>
    axios.post(
      `${API_URL}/close/${conversationId}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    ),

  // ============ Receptionist APIs ============
  receptionistJoin: (conversationId, receptionistId, token) =>
    axios.post(
      `${API_URL}/receptionist/join`,
      { conversationId, receptionistId },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    ),

  receptionistLeave: (conversationId, receptionistId, token) =>
    axios.post(
      `${API_URL}/receptionist/leave`,
      { conversationId, receptionistId },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    ),

  transferConversation: (
    conversationId,
    fromReceptionistId,
    toReceptionistId,
    token,
  ) =>
    axios.post(
      `${API_URL}/transfer`,
      { conversationId, fromReceptionistId, toReceptionistId },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    ),

  getActiveConversations: (receptionistId, token) =>
    axios.get(
      `${API_URL}/active-conversations${receptionistId ? `?receptionistId=${receptionistId}` : ""}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    ),

  getWaitingConversations: (token) =>
    axios.get(`${API_URL}/waiting-conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAllConversations: (token, status = null) =>
    axios.get(
      `${API_URL}/all-conversations${status ? `?status=${status}` : ""}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    ),

  getAllReceptionists: (token) =>
    axios.get(`${API_URL}/receptionists`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  searchConversations: (token, keyword = "", status = null) =>
    axios.get(
      `${API_URL}/search?keyword=${encodeURIComponent(keyword)}${status ? `&status=${status}` : ""}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    ),
};

export default chatLiveAPI;
