import redis from "../config/redis.js";

const CHAT_PREFIX = "chat:";
const CHAT_TTL = 60 * 60; // 1 giờ

export async function getChatHistory(sessionId) {
  const key = `${CHAT_PREFIX}${sessionId}`;
  const historyJson = await redis.get(key);
  return historyJson ? JSON.parse(historyJson) : [];
}

export async function saveChatMessage(sessionId, message) {
  const key = `${CHAT_PREFIX}${sessionId}`;
  const history = await getChatHistory(sessionId);
  history.push(message);
  await redis.set(key, JSON.stringify(history), "EX", CHAT_TTL);
}
