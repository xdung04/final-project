// historyManager.js
// Lưu history trong RAM theo sessionId
// Tự xóa sau 30 phút không hoạt động

const SESSION_TTL = 30 * 60 * 1000; // 30 phút
const store = new Map();

// Dọn session hết hạn mỗi 10 phút
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of store.entries()) {
    if (now - session.lastActive > SESSION_TTL) {
      store.delete(id);
    }
  }
}, 10 * 60 * 1000);

export function getHistory(sessionId) {
  return store.get(sessionId)?.history || [];
}

export function saveHistory(sessionId, history) {
  store.set(sessionId, {
    history,
    lastActive: Date.now(),
  });
}