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