// controllers/hairConsultController.js (IMPROVED)
import {
  getQuiz,
  validateFace,
  analyzeFace,
  analyzeHairConsult,
  APIResponse,
} from "../services/hairConsultService.js";

// =============================================
// GET QUIZ
// =============================================
export const getQuizController = async (req, res) => {
  try {
    const quiz = await getQuiz();
    return res.json(
      APIResponse.success({
        quiz,
      })
    );
  } catch (err) {
    console.error("Lỗi getQuiz:", err);
    return res.status(500).json(
      APIResponse.error(
        "Không thể tải quiz",
        err.message,
        "QUIZ_LOAD_ERROR"
      )
    );
  }
};

// =============================================
// VALIDATE FACE — Face++ Detect (bước 1)
// =============================================
export const validateFaceController = async (req, res) => {
  try {
    const imageFile = req.file;

    // Validate input
    if (!imageFile) {
      return res.status(400).json(
        APIResponse.error(
          "Ảnh bị thiếu",
          null,
          "MISSING_IMAGE"
        )
      );
    }

    const result = await validateFace(imageFile.buffer);

    // Ảnh không hợp lệ
    if (!result.valid) {
      return res.status(422).json(
        APIResponse.validation("validate_face", result.errors)
      );
    }

    // Success
    return res.json(
      APIResponse.success({
        step: "validate_face",
        valid: true,
        confidence: result.confidence,
        meta: result.meta,
      })
    );
  } catch (err) {
    console.error("Lỗi validateFaceController:", err);
    return res.status(500).json(
      APIResponse.error(
        "Lỗi xác thực ảnh",
        err.message,
        "VALIDATION_ERROR"
      )
    );
  }
};

// =============================================
// GENERATE RECOMMENDATION — Full flow (bước 2)
// =============================================
export const generateRecommendation = async (req, res) => {
  try {
    const { flow, quizAnswers } = req.body;
    const imageFile = req.file;

    // ────────────────────────────────────────
    // Step 1: Validate input
    // ────────────────────────────────────────
    const inputErrors = [];

    if (!flow) inputErrors.push("flow");
    if (!quizAnswers) inputErrors.push("quizAnswers");
    if (!imageFile) inputErrors.push("image file");

    if (inputErrors.length > 0) {
      return res.status(400).json(
        APIResponse.error(
          `Thiếu dữ liệu: ${inputErrors.join(", ")}`,
          null,
          "MISSING_INPUT"
        )
      );
    }

    // ────────────────────────────────────────
    // Step 2: Parse JSON
    // ────────────────────────────────────────
    let parsedFlow, parsedAnswers;

    try {
      parsedFlow    = typeof flow === "string" ? JSON.parse(flow) : flow;
      parsedAnswers = typeof quizAnswers === "string" ? JSON.parse(quizAnswers) : quizAnswers;
    } catch (parseErr) {
      return res.status(400).json(
        APIResponse.error(
          "JSON không hợp lệ",
          parseErr.message,
          "INVALID_JSON"
        )
      );
    }

    // Validate flow structure
    if (!parsedFlow?.id || !["flowA", "flowB"].includes(parsedFlow.id)) {
      return res.status(400).json(
        APIResponse.error(
          "Flow không hợp lệ",
          "Cần flow id = 'flowA' hoặc 'flowB'",
          "INVALID_FLOW"
        )
      );
    }

    // ────────────────────────────────────────
    // Step 3: Validate ảnh qua Face++ Detect
    // ────────────────────────────────────────
    let validation;
    try {
      validation = await validateFace(imageFile.buffer);
    } catch (err) {
      return res.status(503).json(
        APIResponse.error(
          "Dịch vụ xác thực ảnh tạm thời không khả dụng",
          err.message,
          "FACE_API_ERROR"
        )
      );
    }

    if (!validation.valid) {
      return res.status(422).json(
        APIResponse.validation("face_validation", validation.errors)
      );
    }

    // ────────────────────────────────────────
    // Step 4: Phân tích khuôn mặt qua Python /predict
    // ────────────────────────────────────────
    let faceMetrics;
    try {
      faceMetrics = await analyzeFace(imageFile.buffer);
    } catch (err) {
      return res.status(503).json(
        APIResponse.error(
          "Dịch vụ phân tích khuôn mặt tạm thời không khả dụng",
          err.message,
          "FACE_ANALYSIS_ERROR"
        )
      );
    }

    // Validate Python response
    if (!faceMetrics?.face_shape || !faceMetrics?.skin_tone) {
      return res.status(502).json(
        APIResponse.error(
          "Phải tích khuôn mặt trả về dữ liệu không đúng format",
          null,
          "INVALID_ANALYSIS_FORMAT"
        )
      );
    }

    // ────────────────────────────────────────
    // Step 5: Gemini tư vấn tóc
    // ────────────────────────────────────────
   // ────────────────────────────────────────
    // Step 5: Groq tư vấn tóc + ghép ảnh DB
    // ────────────────────────────────────────
    let aiResult, matchedStyles;
    try {
      ({ aiResult, matchedStyles } = await analyzeHairConsult({
        flow: parsedFlow,
        answers: parsedAnswers,
        faceMetrics,
      }));
    } catch (err) {
      console.error("Lỗi Groq recommendation:", err);
      return res.status(503).json(
        APIResponse.error(
          "Dịch vụ tư vấn AI tạm thời không khả dụng",
          err.message,
          "RECOMMENDATION_ERROR"
        )
      );
    }

    // ────────────────────────────────────────
    // Success: Trả về full result
    // ────────────────────────────────────────
    return res.json(
      APIResponse.success({
        step: "complete",
        face_analysis: {
          face_shape:     faceMetrics.face_shape,
          skin_tone:      faceMetrics.skin_tone,
          skin_condition: faceMetrics.skin_condition,
          warning:        faceMetrics.warning || null,
        },
        aiResult,       // { face_shape_analysis, top_picks/recommended_styles, color_suggestion, barber_note, ... }
        matchedStyles,  // top_picks/recommended_styles đã gắn coverImage, sideImage, slug từ DB
        // saveToken nhỏ gọn — FE dùng khi POST /hair-analysis/save
        _saveToken: {
          faceShape:         faceMetrics.face_shape?.predicted,
          skinToneUndertone: faceMetrics.skin_tone?.undertone,
          skinType:          faceMetrics.skin_condition?.skin_type_vi,
        },
        validation_meta: {
          confidence:    validation.confidence,
          image_quality: validation.meta?.quality,
        },
      })
    );

  } catch (err) {
    console.error("Lỗi generateRecommendation (uncaught):", err);
    return res.status(500).json(
      APIResponse.error(
        "Lỗi server không xác định",
        err.message,
        "INTERNAL_ERROR"
      )
    );
  }
};

export default {
  getQuizController,
  validateFaceController,
  generateRecommendation,
};