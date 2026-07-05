// services/hairConsultService.js (GROQ VERSION)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import FormData from "form-data";
import Groq from "groq-sdk";
import { searchKnowledge } from "./knowledgeTools.js";
import db from "../models/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const { Hairstyle, Category } = db;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const FACEPP_KEY       = process.env.FACEPLUSPLUS_API_KEY;
const FACEPP_SECRET    = process.env.FACEPLUSPLUS_API_SECRET;
const PYTHON_API_URL   = process.env.PYTHON_API_URL || "http://localhost:8000";

const quizPath = path.join(__dirname, "../data/quiz.json");

// =============================================
// CACHE QUIZ
// =============================================
let quizCache = null;

export const getQuiz = async () => {
  try {
    if (quizCache) return quizCache;
    quizCache = JSON.parse(fs.readFileSync(quizPath, "utf-8"));
    return quizCache;
  } catch (err) {
    console.error("Lỗi getQuiz:", err);
    throw new Error("Không thể tải quiz");
  }
};

// =============================================
// RESPONSE FORMATTER (Consistency)
// =============================================
class APIResponse {
  static success(data) {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message, details = null, code = "ERROR") {
    return {
      success: false,
      error: {
        message,
        code,
        details,
      },
      timestamp: new Date().toISOString(),
    };
  }

  static validation(step, errors) {
    return {
      success: false,
      validation_failed: true,
      step,
      errors,
      timestamp: new Date().toISOString(),
    };
  }
}

// =============================================
// CALL GROQ WITH RETRY & VALIDATION
// =============================================
async function callGroq(prompt, retries = 2) {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY chưa được cấu hình");

  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const message = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: MODEL,
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      const rawText = message.choices[0]?.message?.content || "{}";
      let parsed;

      try {
        parsed = JSON.parse(rawText);
      } catch {
        throw new Error(`Groq trả về JSON không hợp lệ: ${rawText.substring(0, 100)}`);
      }

      if (parsed.error) {
        throw new Error(`Groq error: ${parsed.error}`);
      }

      return parsed;
    } catch (err) {
      lastError = err;
      console.error(`Groq attempt ${attempt}/${retries}:`, err.message);

      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }

  throw new Error(`Groq API thất bại sau ${retries} lần: ${lastError.message}`);
}

// =============================================
// VALIDATE FACE — Face++ Detect API
// =============================================
export const validateFace = async (imageBuffer) => {
  if (!FACEPP_KEY || !FACEPP_SECRET) {
    throw new Error("Face++ API key chưa được cấu hình");
  }

  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("Image buffer rỗng");
  }

  if (imageBuffer.length > 5 * 1024 * 1024) {
    throw new Error("Ảnh quá lớn (max 5MB)");
  }

  const form = new FormData();
  form.append("api_key",    FACEPP_KEY);
  form.append("api_secret", FACEPP_SECRET);
  form.append("image_file", imageBuffer, { filename: "face.jpg", contentType: "image/jpeg" });
  form.append("return_attributes", "headpose,blur,eyestatus,facequality,mouthstatus");

  try {
    const res  = await axios.post("https://api-us.faceplusplus.com/facepp/v3/detect", form, {
      headers: form.getHeaders(),
      timeout: 15000,
    });

    const data = res.data;

    if (data.error_message) {
      throw new Error(`Face++ error: ${data.error_message}`);
    }

    if (!data.faces || data.faces.length === 0) {
      return {
        valid: false,
        errors: ["Không phát hiện khuôn mặt — hãy chụp ảnh chính diện rõ hơn"],
      };
    }

    if (data.faces.length > 1) {
      return {
        valid: false,
        errors: ["Vui lòng chỉ có 1 người trong ảnh"],
      };
    }

    const attrs  = data.faces[0].attributes;
    const errors = [];

    const { pitch_angle, yaw_angle, roll_angle } = attrs.headpose;
    if (Math.abs(pitch_angle) > 20) {
      errors.push(
        pitch_angle > 0
          ? "Mặt đang cúi xuống — hãy nhìn thẳng vào camera"
          : "Mặt đang ngẩng lên — hãy nhìn thẳng vào camera"
      );
    }
    if (Math.abs(yaw_angle) > 20) {
      errors.push("Mặt đang quay ngang — hãy nhìn thẳng vào camera");
    }
    if (Math.abs(roll_angle) > 20) {
      errors.push("Đầu đang nghiêng — hãy giữ đầu thẳng");
    }

    const blurVal = attrs.blur?.blurness?.value ?? 0;
    if (blurVal > 60) {
      errors.push("Ảnh bị mờ — hãy giữ tay cố định khi chụp");
    }

    const quality = attrs.facequality?.value ?? 100;
    if (quality < 40) {
      errors.push("Chất lượng ảnh quá thấp — hãy chụp nơi có đủ ánh sáng");
    }

    const mouthStatus = attrs.mouthstatus;
    if (mouthStatus) {
      const masked = (mouthStatus.surgical_mask_or_respirator ?? 0) > 50;
      if (masked) {
        errors.push("Vui lòng tháo khẩu trang trước khi chụp");
      }
    }

    const leftEye  = attrs.eyestatus?.left_eye_status;
    const rightEye = attrs.eyestatus?.right_eye_status;
    if (leftEye && rightEye) {
      const leftOccluded  = (leftEye.occlusion ?? 0) > 50;
      const rightOccluded = (rightEye.occlusion ?? 0) > 50;
      if (leftOccluded || rightOccluded) {
        errors.push("Vùng mắt bị che khuất — hãy đảm bảo mắt nhìn rõ ràng");
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return {
      valid: true,
      confidence: {
        face_detection: 0.95,
        image_quality: quality / 100,
      },
      meta: {
        pitch_angle, yaw_angle, roll_angle,
        blur: blurVal,
        quality,
      },
    };
  } catch (err) {
    console.error("Lỗi Face++ Detect:", err.message);
    console.error("Face++ response data:", err.response?.data);
    throw new Error("Không thể kết nối Face++ API");
  }
};

// =============================================
// ANALYZE FACE — Python /predict
// =============================================
export const analyzeFace = async (imageBuffer) => {
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("Image buffer rỗng");
  }

  const form = new FormData();
  form.append("file", imageBuffer, { filename: "face.jpg", contentType: "image/jpeg" });

  try {
    const res = await axios.post(`${PYTHON_API_URL}/predict`, form, {
      headers: form.getHeaders(),
      timeout: 20000,
    });

    const data = res.data;
    console.log("=== PYTHON /predict RESPONSE ===");
    console.log(JSON.stringify(data, null, 2));
    console.log("================================");

if (data.error) {
    throw new Error(data.error);
}

if (!data.face_shape || !data.skin_tone || !data.skin_condition) {
    throw new Error("Python API response format không đúng");
}

    const faceConfidence = data.face_shape?.confidence ?? 0;
    if (faceConfidence < 0.5) {
      data.warning = `Độ tin cậy phân loại khuôn mặt thấp (${Math.round(faceConfidence * 100)}%) — gợi ý có thể không chính xác`;
    }

    return data;
  } catch (err) {
    console.error("Lỗi Python /predict:", err.message);

    // Nếu Python trả HTTP 4xx/5xx kèm body
    if (err.response?.data?.error) {
        throw new Error(err.response.data.error);
    }

    // Nếu mình đã throw ở trên
    throw err;
}
};

// =============================================
// BUILD PROMPT
// =============================================
function buildPrompt(flow, answers, faceMetrics, knowledgeContext = "") {
  const { face_shape, skin_tone, skin_condition } = faceMetrics;

  const getAnswer = (key) => answers[key]?.answer || "N/A";

  const top3List = (face_shape.top3 || [])
    .slice(0, 3)
    .map(t => `${t.face_shape} (${Math.round((t.confidence ?? 0) * 100)}%)`)
    .join(", ");

  const faceInfo = `
## THÔNG TIN PHÂN TÍCH KHUÔN MẶT
- Hình dạng khuôn mặt: ${face_shape.predicted} (độ tin cậy: ${Math.round(face_shape.confidence * 100)}%)
- Top 3 dự đoán: ${top3List}

## THÔNG TIN MÀU DA
- Undertone: ${skin_tone.undertone} (${
    skin_tone.undertone === "warm" ? "ấm"
    : skin_tone.undertone === "cool" ? "lạnh"
    : "trung tính"
  })
- Thang Fitzpatrick: ${skin_tone.fitzpatrick_scale}/6 — ${skin_tone.fitzpatrick_label}
- Màu tóc phù hợp: ${(skin_tone.recommended_colors ?? []).join(", ") || "N/A"}
- Màu tóc nên tránh: ${(skin_tone.avoid_colors ?? []).join(", ") || "N/A"}

## TÌNH TRẠNG DA
- Loại da: ${skin_condition.skin_type_vi}
- Vấn đề phát hiện: ${(skin_condition.issues ?? []).join(", ") || "Không phát hiện"}
`;

  const knowledgeSection = knowledgeContext
    ? `\n${knowledgeContext}\n⚠️ Ưu tiên sử dụng kiến thức từ tiệm ở trên khi đưa ra gợi ý cụ thể.\n`
    : "";

  if (flow.id === "flowA") {
    return `
Bạn là chuyên gia barber cao cấp với 10 năm kinh nghiệm tư vấn tóc nam tại Việt Nam.
Hãy tư vấn bằng tiếng Việt, thực tế, cụ thể và chuyên nghiệp.

${faceInfo}
${knowledgeSection}
## YÊU CẦU CỦA KHÁCH
- Kiểu tóc muốn cắt: ${getAnswer("A1")}
- Chất tóc: ${getAnswer("A2")}
- Tình trạng trán: ${getAnswer("A3")}
- Thói quen tạo kiểu: ${getAnswer("A4")}
- Sẵn sàng xử lý hóa chất: ${getAnswer("A5")}

## NHIỆM VỤ
Phân tích tính khả thi của kiểu tóc khách muốn dựa trên khuôn mặt, chất tóc và thói quen thực tế.
Đưa ra lời khuyên thực tế, không nói chung chung.

Trả về JSON theo đúng cấu trúc sau (không thêm field khác):
{
  "feasibility": "high | medium | low",
  "verdict": "1 câu nhận xét ngắn về tính khả thi",
  "face_shape_analysis": "Phân tích cụ thể khuôn mặt ${face_shape.predicted} ảnh hưởng thế nào đến kiểu tóc này",
  "adjustments": [
    "Điều chỉnh cụ thể 1 để kiểu tóc phù hợp hơn với khuôn mặt",
    "Điều chỉnh cụ thể 2"
  ],
  "recommended_styles": [
    {
      "name": "Tên kiểu tóc cụ thể",
      "description": "Mô tả ngắn dễ hiểu",
      "why_fits": "Lý do cụ thể phù hợp với khuôn mặt ${face_shape.predicted} và chất tóc của khách",
      "maintenance": "low | medium | high"
    }
  ],
  "color_suggestion": {
    "recommended": "Tên màu cụ thể phù hợp nhất với undertone ${skin_tone.undertone} và Fitzpatrick ${skin_tone.fitzpatrick_scale}",
    "technique": "Kỹ thuật nhuộm gợi ý (balayage, highlights, full color...)",
    "reason": "Lý do cụ thể phù hợp với màu da khách"
  },
  "barber_note": "Lời khuyên chân thành, thực tế từ barber dành riêng cho khách này"
}`;
  }

  return `
Bạn là chuyên gia barber cao cấp với 10 năm kinh nghiệm tư vấn tóc nam tại Việt Nam.
Hãy tư vấn bằng tiếng Việt, thực tế, cụ thể và chuyên nghiệp.

${faceInfo}
${knowledgeSection}
## NHU CẦU CỦA KHÁCH
- Vấn đề muốn cải thiện: ${getAnswer("B1")}
- Phong cách mong muốn: ${getAnswer("B2")}
- Thời gian tạo kiểu buổi sáng: ${getAnswer("B3")}
- Quan tâm nhuộm/uốn: ${getAnswer("B4")}
- Chất tóc: ${getAnswer("B5")}

## NHIỆM VỤ
Dựa trên toàn bộ thông tin trên, tư vấn kiểu tóc phù hợp nhất cho khách.
Lưu ý đặc biệt đến vấn đề khách đề cập: "${getAnswer("B1")}"
Đề xuất kiểu tóc phù hợp với phong cách "${getAnswer("B2")}" và thời gian tạo kiểu "${getAnswer("B3")}".

Trả về JSON theo đúng cấu trúc sau (không thêm field khác):
{
  "face_shape_analysis": "Phân tích cụ thể khuôn mặt ${face_shape.predicted} và cách chọn tóc che khuyết điểm, phát huy ưu điểm",
  "top_picks": [
    {
      "name": "Tên kiểu tóc cụ thể (VD: Two Block Hàn Quốc, Crew Cut, Undercut...)",
      "description": "Mô tả ngắn dễ hình dung",
      "why_fits": "Lý do cụ thể phù hợp với khuôn mặt ${face_shape.predicted}, phong cách và vấn đề khách muốn cải thiện",
      "how_to_style": "Hướng dẫn tạo kiểu ngắn gọn, thực tế",
      "maintenance": "low | medium | high"
    }
  ],
  "styles_to_avoid": [
    {
      "name": "Tên kiểu tóc cụ thể nên tránh",
      "reason": "Lý do cụ thể không phù hợp với khuôn mặt hoặc vấn đề của khách"
    }
  ],
  "color_suggestion": {
    "recommended": "Tên màu cụ thể phù hợp nhất với undertone ${skin_tone.undertone} và Fitzpatrick ${skin_tone.fitzpatrick_scale}",
    "technique": "Kỹ thuật nhuộm gợi ý phù hợp với yêu cầu của khách",
    "reason": "Lý do cụ thể phù hợp với màu da và phong cách khách muốn"
  },
  "skin_note": "Lưu ý thực tế về tình trạng da (${skin_condition.skin_type_vi}) ảnh hưởng đến việc chọn và chăm sóc tóc",
  "barber_note": "Lời khuyên chân thành, thực tế từ barber dành riêng cho khách này dựa trên toàn bộ thông tin phân tích"
}`;
}

// =============================================
// VALIDATE RESPONSE STRUCTURE
// =============================================
function validateRecommendationResponse(response, flowId) {
  const requiredFields = {
    flowA: [
      "feasibility",
      "verdict",
      "face_shape_analysis",
      "adjustments",
      "recommended_styles",
      "color_suggestion",
      "barber_note",
    ],
    flowB: [
      "face_shape_analysis",
      "top_picks",
      "styles_to_avoid",
      "color_suggestion",
      "skin_note",
      "barber_note",
    ],
  };

  const fields = requiredFields[flowId];
  if (!fields) throw new Error(`Flow không hợp lệ: ${flowId}`);

  const missing = fields.filter(f => !(f in response));
  if (missing.length > 0) {
    throw new Error(`Response thiếu field: ${missing.join(", ")}`);
  }

  return true;
}

// =============================================
// MATCH AI STYLE NAMES → DB HAIRSTYLES
// Ghép tên kiểu tóc AI đề xuất với bản ghi DB để lấy ảnh
// =============================================
function normalizeText(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // bỏ dấu tiếng Việt
    .replace(/[^a-z0-9\s]/g, " ")    // ký tự đặc biệt → space
    .replace(/\s+/g, " ")
    .trim();
}

function calcMatchScore(aiName, dbName) {
  const a = normalizeText(aiName);
  const b = normalizeText(dbName);
  if (!a || !b) return 0;

  // Exact match
  if (a === b) return 1.0;

  // Một bên chứa bên kia
  if (a.includes(b) || b.includes(a)) return 0.85;

  // Keyword overlap
  const wordsA = a.split(" ").filter(w => w.length > 1);
  const wordsB = b.split(" ").filter(w => w.length > 1);
  const setB   = new Set(wordsB);
  const common = wordsA.filter(w => setB.has(w)).length;
  if (!wordsA.length || !wordsB.length) return 0;
  return common / Math.max(wordsA.length, wordsB.length);
}

async function matchHairstylesToDB(aiStyles = [], threshold = 0.45) {
  if (!aiStyles.length) return [];

  // 1 lần query lấy toàn bộ hairstyle Active
  const dbStyles = await Hairstyle.findAll({
    where:      { status: "Active" },
    include:    [{ model: Category, as: "category", attributes: ["idCategory", "name"] }],
    attributes: [
      "idHairstyle", "name", "slug", "shortDescription",
      "coverImage", "sideImage", "difficultyLevel", "maintenanceLevel",
    ],
  });

  return aiStyles.map(aiStyle => {
    let best = null, bestScore = 0;

    for (const dbStyle of dbStyles) {
      const score = calcMatchScore(aiStyle.name, dbStyle.name);
      if (score > bestScore) { bestScore = score; best = dbStyle; }
    }

    // Payload chung từ AI
    const basePayload = {
      aiName:       aiStyle.name,
      description:  aiStyle.description  || null,
      why_fits:     aiStyle.why_fits     || null,
      how_to_style: aiStyle.how_to_style || null,
      maintenance:  aiStyle.maintenance  || null,
      matchScore:   Math.round(bestScore * 100),
    };

    if (bestScore >= threshold && best) {
      return {
        ...basePayload,
        // Data từ DB
        idHairstyle:      best.idHairstyle,
        dbName:           best.name,
        slug:             best.slug,
        shortDescription: best.shortDescription,
        coverImage:       best.coverImage,
        sideImage:        best.sideImage,
        difficultyLevel:  best.difficultyLevel,
        maintenanceLevel: best.maintenanceLevel,
        category:         best.category,
      };
    }

    // Không khớp → trả về info AI, báo FE biết để hiển thị placeholder
    return { ...basePayload, coverImage: null, sideImage: null, noDbMatch: true };
  });
}

// =============================================
// ANALYZE HAIR CONSULT — Main function
// =============================================
export const analyzeHairConsult = async ({ flow, answers, faceMetrics }) => {
  if (!flow?.id) throw new Error("Thiếu flow id");
  if (!answers || !Object.keys(answers).length) throw new Error("Thiếu câu trả lời quiz");
  if (!faceMetrics) throw new Error("Thiếu dữ liệu phân tích khuôn mặt");

  const { face_shape, skin_tone } = faceMetrics;
  const getAnswer = (key) => answers[key]?.answer || "";

  const isFlowA = flow.id === "flowA";

  // ── Build query cho Pinecone ──
  const hairstyleQuery = isFlowA
    ? `kiểu tóc ${getAnswer("A1")} mặt ${face_shape.predicted} chất tóc ${getAnswer("A2")}`
    : `kiểu tóc mặt ${face_shape.predicted} phong cách ${getAnswer("B2")} chất tóc ${getAnswer("B5")}`;

  const wantsColor = isFlowA
    ? getAnswer("A5").toLowerCase().includes("nhuộm") || getAnswer("A5").toLowerCase().includes("tẩy")
    : !getAnswer("B4").toLowerCase().includes("không") && !getAnswer("B4").toLowerCase().includes("đen nguyên");

  const colorQuery = `màu tóc ${skin_tone.undertone} undertone Fitzpatrick ${skin_tone.fitzpatrick_scale}`;

  // ── Search Pinecone song song ──
  console.log("🔍 Searching Pinecone knowledge...");
  const [hairstyleRes, colorRes, haircareRes] = await Promise.allSettled([
    searchKnowledge({ query: hairstyleQuery, namespace: "hairstyles" }),
    wantsColor
      ? searchKnowledge({ query: colorQuery, namespace: "colors" })
      : Promise.resolve({ results: [] }),
    searchKnowledge({
      query: `chăm sóc tóc ${faceMetrics.skin_condition?.skin_type_vi || ""}`,
      namespace: "haircare"
    }),
  ]);

  const hairstyleKnowledge = hairstyleRes.status === "fulfilled" ? (hairstyleRes.value?.results || []) : [];
  const colorKnowledge     = colorRes.status === "fulfilled"     ? (colorRes.value?.results || [])     : [];
  const haircareKnowledge  = haircareRes.status === "fulfilled"  ? (haircareRes.value?.results || [])  : [];

  console.log(`📚 Knowledge: hairstyles=${hairstyleKnowledge.length}, colors=${colorKnowledge.length}, haircare=${haircareKnowledge.length}`);

  const buildKnowledgeSection = (results, label) => {
    if (!results.length) return "";
    const validResults = results
      .filter(r => r.score > 0.5)
      .slice(0, 3)
      .map((r, i) => {
        console.log(`[Knowledge ${label}] result ${i}:`, JSON.stringify(r));
        const content = r.content || r.text || r.description || JSON.stringify(r);
        return content && content !== "{}" ? `${i + 1}. ${content}` : null;
      })
      .filter(Boolean);
    if (!validResults.length) return "";
    return `\n## ${label}\n${validResults.join("\n")}`;
  };

  const knowledgeContext = [
    buildKnowledgeSection(hairstyleKnowledge, "KIẾN THỨC KIỂU TÓC TỪ TIỆM"),
    buildKnowledgeSection(colorKnowledge,     "KIẾN THỨC MÀU NHUỘM TỪ TIỆM"),
    buildKnowledgeSection(haircareKnowledge,  "KIẾN THỨC CHĂM SÓC TÓC TỪ TIỆM"),
  ].filter(Boolean).join("\n");

  const prompt = buildPrompt(flow, answers, faceMetrics, knowledgeContext);

  console.log("=== PINECONE RAW RESULT ===");
  console.log(JSON.stringify(hairstyleKnowledge[0], null, 2));
  console.log("=== PROMPT GỬI GROQ ===");
  console.log(prompt);
  console.log("====================");

  try {
    const aiResult = await callGroq(prompt);
    console.log("=== GROQ RESULT ===");
    console.log(JSON.stringify(aiResult, null, 2));

    validateRecommendationResponse(aiResult, flow.id);

    // ── Ghép ảnh DB vào kết quả AI ──
    const aiStyles = isFlowA
      ? (aiResult.recommended_styles || [])
      : (aiResult.top_picks || []);

    const matchedStyles = await matchHairstylesToDB(aiStyles);
    console.log(`🎯 Matched ${matchedStyles.filter(s => !s.noDbMatch).length}/${aiStyles.length} styles với DB`);

    // Trả về tách biệt: aiResult giữ nguyên, matchedStyles có thêm ảnh
    return { aiResult, matchedStyles };
  } catch (err) {
    console.error("Lỗi analyzeHairConsult:", err.message);
    throw err;
  }
};

export { APIResponse };
export default {
  getQuiz,
  validateFace,
  analyzeFace,
  analyzeHairConsult,
  APIResponse,
};