import { getChatHistory, saveChatMessage } from "../services/chatService.js";
import { sendMessage as sendToGemini } from "../services/geminiService.js";

export async function handleChat(req, res) {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) return res.status(400).json({ error: "Missing data" });

    const history = await getChatHistory(sessionId);

    // gửi message + lịch sử lên Gemini
    const { reply } = await sendToGemini({ message, history });

    // lưu user + AI vào Redis
    await saveChatMessage(sessionId, { type: "user", content: message });
    await saveChatMessage(sessionId, { type: "ai", content: reply });

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Đã xảy ra lỗi, thử lại sau" });
  }
}
