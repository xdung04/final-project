import { Pinecone } from "@pinecone-database/pinecone";
import axios from "axios";
import { createEmbedding } from "./pineconeService.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL_MAIN = "gemini-2.5-flash";      
const GEMINI_MODEL_INTENT = process.env.GEMINI_MODEL;   

// ---------------------
// Khởi tạo Pinecone client
// ---------------------
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index("project", "project-yfyk5m4.svc.aped-4627-b74a.pinecone.io");

// ---------------------
// Gọi Gemini API
// ---------------------
async function callGemini(model, payload, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        payload,
        { headers: { "Content-Type": "application/json", "X-goog-api-key": GEMINI_API_KEY } }
      );
      return res.data;
    } catch (err) {
      if (err.response?.status === 503 && i < retries - 1) {
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      } else {
        throw err;
      }
    }
  }
}

// ---------------------
// Phân tích intent từ khách
// ---------------------
async function analyzeIntent(message) {
  const intentPrompt = `
Bạn là hệ thống phân loại câu hỏi khách hàng của barbershop Nam.
Chỉ trả về một từ:
- "branches" → nếu khách hỏi về chi nhánh hoặc dịch vụ
- "barbers" → nếu khách hỏi về thợ, kiểu tóc, sản phẩm tóc
- "general" → nếu không liên quan tới tiệm

Ví dụ:
- "Chi nhánh nào gần tôi?" → branches
- "Ở chi nhánh quận 1 có ai chuyên fade không?" → barbers
- "Mấy giờ mở cửa?" → branches
- "Bạn có người yêu chưa?" → general

Câu hỏi: "${message}"
Trả lời một từ:`;

  const payload = { contents: [{ parts: [{ text: intentPrompt }] }] };
  const response = await callGemini(GEMINI_MODEL_INTENT, payload);

  const intent = response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() || "general";

  // Chỉ trả về "barbers" hoặc "branches", nếu không thì default general
  if (intent === "barbers" || intent === "branches") return intent;
  return "general";
}

// ---------------------
// Query Pinecone dựa trên namespace
// ---------------------
async function queryPineconeByMessage(message, namespace, topK = 5) {
  const queryVector = await createEmbedding(message);
  const nsIndex = index.namespace(namespace);
  const res = await nsIndex.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
    includeValues: false,
  });

  return res.matches || [];
}

// ---------------------
// Hàm chính xử lý pipeline
// ---------------------
export async function sendMessage({ message }) {
  try {
    // 1️⃣ Phân tích intent
    const intent = await analyzeIntent(message);

    let pineconeInfo = "";
    if (intent === "barbers" || intent === "branches") {
      // 2️⃣ Query đúng namespace
      const results = await queryPineconeByMessage(message, intent, 5);

      if (results.length) {
        pineconeInfo = results
          .map((r, i) => {
            const meta = r.metadata?.metadata ? JSON.parse(r.metadata.metadata) : {};
            const details = r.metadata?.text?.trim().replace(/\n+/g, " ") || "Không có chi tiết";
            return `${i + 1}. ${meta.fullName || meta.name || "N/A"} (${meta.branchName || meta.address || "N/A"}) - ${details}`;
          })
          .join("\n");
      }
    }

    // 3️⃣ Gọi Gemini chính tạo phản hồi
    const systemPrompt = `
Bạn là trợ lý AI của barbershop Nam.
- Phong cách: thân thiện, tự nhiên, lịch sự, cởi mở, dễ gần.
- Trả lời chi tiết về tóc, kiểu tóc, thợ, chi nhánh hoặc sản phẩm chăm sóc tóc.
- Nếu có dữ liệu từ Pinecone, hãy sử dụng để tư vấn.
- Nếu không có dữ liệu, trả lời theo kiến thức chung, và lịch sự xin lỗi nếu thiếu thông tin.
- Nếu câu hỏi không liên quan đến tiệm hoặc tóc, hãy từ chối khéo léo.

${pineconeInfo ? "Thông tin từ Pinecone:\n" + pineconeInfo : "Không có dữ liệu."}

Câu hỏi khách: ${message}
Trả lời ngắn gọn, tự nhiên, rõ ràng.
`;

    const payload = { contents: [{ parts: [{ text: systemPrompt }] }] };
    const response = await callGemini(GEMINI_MODEL_MAIN, payload);

    const reply = response?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "AI không phản hồi 😅";

    return { intent, reply };
  } catch (err) {
    console.error("Gemini Agent error:", err.response?.data || err.message);
    return { reply: "Đã xảy ra lỗi khi xử lý yêu cầu 😢" };
  }
}
