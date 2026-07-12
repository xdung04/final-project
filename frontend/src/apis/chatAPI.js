import * as request from "~/apis/configs/httpRequest";

export const sendMessage = async ({ message, image, sessionId }) => {
  try {
    const res = await request.post("/chat", { message, image, sessionId });
    return res;
  } catch (err) {
    throw err;
  }
};

export const syncPostLogin = async ({ sessionId }) => {
  try {
    const res = await request.post("/chat/sync", { sessionId });
    return res;
  } catch (err) {
    throw err;
  }
};

export const requestHumanSupport = async () => {
  try {
    const res = await request.post("/chat/request-human", {});
    return res;
  } catch (err) {
    throw err;
  }
};

export const closeConversationOnLogout = async () => {
  try {
    const res = await request.post("/chat/logout-clean", {});
    return res;
  } catch (err) {
    throw err;
  }
};

// ✅ MỚI: Xoá toàn bộ cuộc trò chuyện AI (Redis cho guest / DB cho khách đăng nhập)
export const clearConversation = async () => {
  try {
    const res = await request.del("/chat/conversation");
    return res;
  } catch (err) {
    throw err;
  }
};


// ✅ Huỷ khi đang chờ lễ tân (chưa ai nhận phòng)
export const cancelWaiting = async () => {
  try {
    const res = await request.post("/chat/cancel-waiting", {});
    return res;
  } catch (err) {
    throw err;
  }
};

// ✅ Rời chat đang live với lễ tân
export const leaveLiveChat = async () => {
  try {
    const res = await request.post("/chat/leave-live", {});
    return res;
  } catch (err) {
    throw err;
  }
};