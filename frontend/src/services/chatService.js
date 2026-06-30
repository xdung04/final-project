// src/services/chatService.js
import * as chatAPI from "~/apis/chatAPI";

/**
 * 🚀 1. Hàm gửi tin nhắn chat chính
 * Nhận đầy đủ tham số từ component AIChat và chuyển tiếp xuống tầng API
 */
export const sendMessage = async ({ message, image, sessionId, customerId }) => {
  try {
    const res = await chatAPI.sendMessage({ 
      message, 
      image, 
      sessionId, 
      customerId 
    });
    return res; // Trả data kết quả từ backend về cho component nhận
  } catch (err) {
    throw err;
  }
};

/**
 * 🔄 2. Hàm đồng bộ dữ liệu sau khi đăng nhập thành công
 * Đóng vai trò trung chuyển gọi xuống hàm syncPostLogin của file chatAPI
 */
export const syncPostLogin = async ({ sessionId, customerId }) => {
  try {
    const res = await chatAPI.syncPostLogin({ 
      sessionId, 
      customerId 
    });
    return res;
  } catch (err) {
    throw err;
  }
};
export const requestHumanSupport = async () => {
  try {
    const res = await chatAPI.requestHumanSupport();
    return res; // Trả kết quả thành công ({ success: true, status: "waiting" }) về cho Component
  } catch (err) {
    throw err;
  }
};
export const closeConversationOnLogout = async () => {
  try {
    const res = await chatAPI.closeConversationOnLogout();
    return res;
  } catch (err) {
    throw err;
  }
};