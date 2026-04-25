// client/src/services/chatLiveService.js
import chatLiveAPI from "~/apis/chatLiveAPI";

// ============ Customer Services ============
export const getOrCreateConversation = async (customerId, token) => {
  try {
    const res = await chatLiveAPI.getOrCreateConversation(customerId, token);
    return res.data;
  } catch (error) {
    console.error("Lỗi lấy/tạo conversation:", error);
    throw error;
  }
};

export const getChatHistory = async (conversationId, token, limit = 50, offset = 0) => {
  try {
    const res = await chatLiveAPI.getHistory(conversationId, token, limit, offset);
    return res.data;
  } catch (error) {
    console.error("Lỗi lấy lịch sử chat:", error);
    throw error;
  }
};

export const closeCustomerConversation = async (conversationId, token) => {
  try {
    const res = await chatLiveAPI.closeConversation(conversationId, token);
    return res.data;
  } catch (error) {
    console.error("Lỗi đóng conversation:", error);
    throw error;
  }
};

// ============ Receptionist Services ============
export const receptionistJoin = async (conversationId, receptionistId, token) => {
  try {
    const res = await chatLiveAPI.receptionistJoin(conversationId, receptionistId, token);
    return res.data;
  } catch (error) {
    console.error("Lỗi lễ tân join:", error);
    throw error;
  }
};

export const receptionistLeave = async (conversationId, receptionistId, token) => {
  try {
    const res = await chatLiveAPI.receptionistLeave(conversationId, receptionistId, token);
    return res.data;
  } catch (error) {
    console.error("Lỗi lễ tân leave:", error);
    throw error;
  }
};

export const transferConversation = async (conversationId, fromReceptionistId, toReceptionistId, token) => {
  try {
    const res = await chatLiveAPI.transferConversation(conversationId, fromReceptionistId, toReceptionistId, token);
    return res.data;
  } catch (error) {
    console.error("Lỗi transfer conversation:", error);
    throw error;
  }
};

export const getActiveConversations = async (receptionistId, token) => {
  try {
    const res = await chatLiveAPI.getActiveConversations(receptionistId, token);
    return res.data; // Trả về array
  } catch (error) {
    console.error("Lỗi lấy active conversations:", error);
    throw error;
  }
};

export const getWaitingConversations = async (token) => {
  try {
    const res = await chatLiveAPI.getWaitingConversations(token);
    return res.data; // Trả về array
  } catch (error) {
    console.error("Lỗi lấy waiting conversations:", error);
    throw error;
  }
};

export const getAllConversations = async (token, status = null) => {
  try {
    const res = await chatLiveAPI.getAllConversations(token, status);
    return res.data;
  } catch (error) {
    console.error("Lỗi lấy tất cả conversations:", error);
    throw error;
  }
};

export const getAllReceptionists = async (token) => {
  try {
    const res = await chatLiveAPI.getAllReceptionists(token);
    return res.data;
  } catch (error) {
    console.error("Lỗi lấy danh sách lễ tân:", error);
    throw error;
  }
};

