// src/apis/chatAPI.js
import * as request from "~/apis/configs/httpRequest";

const API_URL = process.env.REACT_APP_API_BASE_URL + "/chat";
export const sendMessage = async ({ message }) => {
  try {
    const payload = { sessionId: "test-session-123", message };
    const res = await request.post(API_URL, payload);
    return res;
  } catch (err) {
    throw err.response?.data || err;
  }
};
