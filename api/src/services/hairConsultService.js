// services/hairConsultService.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

// 🔹 Tạo __dirname trong ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite"; // hoặc gemini-2.0-flash-lite

// 🔹 Đường dẫn quiz.json
const quizPath = path.join(__dirname, "../data/quiz.json");

// ---------------------- HELPER ----------------------
async function callGemini(modelName, payload) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY chưa được cấu hình.");

  const finalPayload = {
    ...payload,
    generationConfig: { response_mime_type: "application/json" },
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  const headers = { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY };

  try {
    const res = await axios.post(endpoint, finalPayload, { headers });
    const rawText = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    return JSON.parse(rawText); // parse JSON sẵn
  } catch (err) {
    console.error(`Lỗi call Gemini ${modelName}:`, err.response?.data || err.message);
    throw new Error(`Failed to call Gemini ${modelName}`);
  }
}

// ---------------------- HAIR CONSULT ----------------------
export const getQuiz = async () => {
  try {
    const data = fs.readFileSync(quizPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Lỗi getQuiz:", err);
    throw err;
  }
};

/**
 * Hàm duy nhất phân tích hair consult
 * @param {Object} params 
 *   - flow: {id, label}
 *   - answers: object quiz
 *   - faceMetrics: object metrics
 */
export const analyzeHairConsult = async ({ flow, answers, faceMetrics }) => {
  if (!flow || !flow.id) throw new Error("Thiếu flow id");
  if (!answers || Object.keys(answers).length === 0) throw new Error("Thiếu câu trả lời quiz");

const prompt = `
Bạn là chuyên gia tư vấn tóc nam.

}
`;

  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  try {
    const geminiRes = await callGemini(GEMINI_MODEL, payload);
    console.log("Gemini raw:", geminiRes);

    // Trả về đúng object mà frontend cần
  return geminiRes;
  } catch (err) {
    console.error("Lỗi analyzeHairConsult:", err);
    throw err;
  }
};

export default {
  getQuiz,
  analyzeHairConsult,
};
