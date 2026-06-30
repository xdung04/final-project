// client/src/services/chatLiveService.js
import chatLiveAPI from "~/apis/chatLiveAPI";

// Không còn cần truyền token ở bất kỳ hàm nào — cookie tự gửi kèm.
// LƯU Ý: chatLiveAPI giờ trả thẳng data (đã bóc .data sẵn ở httpRequest.js),
// nên bỏ hết .data ở dưới.

// ============ Customer Services ============
export const getOrCreateConversation = async (customerId) => {
  try {
    const res = await chatLiveAPI.getOrCreateConversation(customerId);
    return res;
  } catch (error) {
    console.error("Lỗi lấy/tạo conversation:", error);
    throw error;
  }
};

export const getChatHistory = async (conversationId, limit = 50, offset = 0) => {
  try {
    const res = await chatLiveAPI.getHistory(conversationId, limit, offset);
    return res;
  } catch (error) {
    console.error("Lỗi lấy lịch sử chat:", error);
    throw error;
  }
};

export const closeCustomerConversation = async (conversationId) => {
  try {
    const res = await chatLiveAPI.closeConversation(conversationId);
    return res;
  } catch (error) {
    console.error("Lỗi đóng conversation:", error);
    throw error;
  }
};

// ============ Receptionist Services ============
export const receptionistJoin = async (conversationId, receptionistId) => {
  try {
    const res = await chatLiveAPI.receptionistJoin(conversationId, receptionistId);
    return res;
  } catch (error) {
    console.error("Lỗi lễ tân join:", error);
    throw error;
  }
};

export const receptionistLeave = async (conversationId, receptionistId) => {
  try {
    const res = await chatLiveAPI.receptionistLeave(conversationId, receptionistId);
    return res;
  } catch (error) {
    console.error("Lỗi lễ tân leave:", error);
    throw error;
  }
};

export const transferConversation = async (
  conversationId,
  fromReceptionistId,
  toReceptionistId,
) => {
  try {
    const res = await chatLiveAPI.transferConversation(
      conversationId,
      fromReceptionistId,
      toReceptionistId,
    );
    return res;
  } catch (error) {
    console.error("Lỗi transfer conversation:", error);
    throw error;
  }
};

export const getActiveConversations = async (receptionistId) => {
  try {
    const res = await chatLiveAPI.getActiveConversations(receptionistId);
    return res;
  } catch (error) {
    console.error("Lỗi lấy active conversations:", error);
    throw error;
  }
};

export const getWaitingConversations = async () => {
  try {
    const res = await chatLiveAPI.getWaitingConversations();
    return res;
  } catch (error) {
    console.error("Lỗi lấy waiting conversations:", error);
    throw error;
  }
};

export const getAllConversations = async (status = null) => {
  try {
    const res = await chatLiveAPI.getAllConversations(status);
    return res;
  } catch (error) {
    console.error("Lỗi lấy tất cả conversations:", error);
    throw error;
  }
};

export const getAllReceptionists = async () => {
  try {
    const res = await chatLiveAPI.getAllReceptionists();
    return res;
  } catch (error) {
    console.error("Lỗi lấy danh sách lễ tân:", error);
    throw error;
  }
};

export const searchConversations = async (keyword, status = null) => {
  const res = await chatLiveAPI.searchConversations(keyword, status);
  return res;
};