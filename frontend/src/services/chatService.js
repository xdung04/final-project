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
      customerId,
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
      customerId,
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

// ✅ MỚI: dùng cho nút "Xoá cuộc trò chuyện" trong AIChat.jsx (handleClearConversation)
export const clearConversation = async () => {
  try {
    const res = await chatAPI.clearConversation();
    return res;
  } catch (err) {
    throw err;
  }
};

// ✅ dùng cho nút "Huỷ chờ lễ tân" (handleCancelWaiting)
export const cancelWaiting = async () => {
  try {
    const res = await chatAPI.cancelWaiting();
    return res;
  } catch (err) {
    throw err;
  }
};

// ✅ dùng cho nút "Rời chat live" (handleLeaveLiveChat)
export const leaveLiveChat = async () => {
  try {
    const res = await chatAPI.leaveLiveChat();
    return res;
  } catch (err) {
    throw err;
  }
};