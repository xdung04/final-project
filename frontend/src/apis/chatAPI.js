import * as request from "~/apis/configs/httpRequest";

// Hàm lấy token từ localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem("accessToken");
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

export const sendMessage = async ({ message, image, sessionId }) => {
  try {
    const payload = { message, image, sessionId }; // 💡 Không thèm truyền customerId ở đây nữa
    
    // Gửi kèm header chứa Bearer Token
    const res = await request.post("/chat", payload, getAuthHeader()); 
    return res;
  } catch (err) {
    throw err;
  }
};

export const syncPostLogin = async ({ sessionId }) => {
  try {
    const res = await request.post("/chat/sync", { sessionId }, getAuthHeader());
    return res;
  } catch (err) {
    throw err;
  }
};
export const requestHumanSupport = async () => {
  try {
    // Gọi trúng endpoint "/chat/request-human" mà chúng ta vừa định nghĩa ở Route Backend
    const res = await request.post("/chat/request-human", {}, getAuthHeader()); 
    return res;
  } catch (err) {
    throw err;
  }
};
export const closeConversationOnLogout = async () => {
  try {
    // Gọi trúng endpoint "/chat/logout-clean" đã định nghĩa ở Route Backend
    // Vẫn truyền getAuthHeader() để Backend bốc được Token của người đang chuẩn bị logout
    const res = await request.post("/chat/logout-clean", {}, getAuthHeader());
    return res;
  } catch (err) {
    throw err;
  }
};