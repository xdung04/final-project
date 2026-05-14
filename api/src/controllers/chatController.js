// chatController.js
import { sendMessage } from "../services/llmService.js";
import { getHistory, saveHistory } from "../services/historyManager.js";

export async function handleChat(req, res) {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: "Missing sessionId or message" });
    }

    // Lấy history cũ của session này
    const history = getHistory(sessionId);

    // Gọi LLM với history
    const result = await sendMessage({ message, history });

    // Lưu history mới lại
    saveHistory(sessionId, result.history);

    return res.json({
      reply:            result.reply,
      intent:           result.intent,
      needReceptionist: result.needReceptionist,
    });
  } catch (err) {
    console.error("Chat controller error:", err.message);
    return res.status(500).json({ reply: "Đã xảy ra lỗi, thử lại sau" });
  }
}