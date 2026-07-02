// controllers/hairAnalysisController.js
import {
  saveAnalysis,
  rateAnalysis,
  getLatestAnalysis,
  getAnalysisStats,
} from "../services/hairAnalysisService.js";
import { APIResponse } from "../services/hairConsultService.js";
import db from "../models/index.js";

const { HairAnalysis } = db;

// =============================================
// POST /api/hair-analysis/save
// Body: { _saveToken, selectedHairstyleName? }
// =============================================
export const saveAnalysisResult = async (req, res) => {
  try {
    // idCustomer = idUser (shared PK)
    const customerId = req.user?.idUser;
    if (!customerId) {
      return res.status(401).json(
        APIResponse.error("Chưa đăng nhập", null, "UNAUTHORIZED")
      );
    }

    const { _saveToken, selectedHairstyleName } = req.body;
    if (!_saveToken) {
      return res.status(400).json(
        APIResponse.error("Thiếu _saveToken", null, "MISSING_TOKEN")
      );
    }

    const faceMetrics = {
      face_shape:     { predicted:    _saveToken.faceShape },
      skin_tone:      { undertone:    _saveToken.skinToneUndertone },
      skin_condition: { skin_type_vi: _saveToken.skinType },
    };

    const record = await saveAnalysis(customerId, faceMetrics, selectedHairstyleName || null);

    return res.status(201).json(
      APIResponse.success({
        idAnalysis: record.idAnalysis,
        message:    "Đã lưu kết quả phân tích",
      })
    );
  } catch (err) {
    console.error("Lỗi saveAnalysisResult:", err);
    return res.status(500).json(
      APIResponse.error(err.message, null, "SAVE_ERROR")
    );
  }
};

// =============================================
// PATCH /api/hair-analysis/:idAnalysis/rate
// Body: { rating: number, feedback?: string }
// =============================================
export const rateAnalysisResult = async (req, res) => {
  try {
    const customerId = req.user?.idUser;
    if (!customerId) {
      return res.status(401).json(
        APIResponse.error("Chưa đăng nhập", null, "UNAUTHORIZED")
      );
    }

    const idAnalysis = parseInt(req.params.idAnalysis, 10);
    const { rating, feedback } = req.body;

    if (!rating) {
      return res.status(400).json(
        APIResponse.error("Thiếu rating", null, "MISSING_RATING")
      );
    }

    const record = await rateAnalysis(idAnalysis, customerId, Number(rating), feedback);

    return res.json(
      APIResponse.success({
        idAnalysis: record.idAnalysis,
        rating:     record.rating,
        feedback:   record.feedback,
        message:    "Cảm ơn bạn đã đánh giá!",
      })
    );
  } catch (err) {
    console.error("Lỗi rateAnalysisResult:", err);
    const status = err.message.includes("Không tìm thấy") ? 404
                 : err.message.includes("Rating")         ? 400
                 : 500;
    return res.status(status).json(
      APIResponse.error(err.message, null, "RATE_ERROR")
    );
  }
};

// =============================================
// GET /api/hair-analysis/booking-suggestions
// Query: ?faceShape=oval&categoryId=1&limit=20
// =============================================

// =============================================
// GET /api/hair-analysis/my-history
// =============================================
export const getMyHistory = async (req, res) => {
  try {
    const customerId = req.user?.idUser;
    if (!customerId) {
      return res.status(401).json(
        APIResponse.error("Chưa đăng nhập", null, "UNAUTHORIZED")
      );
    }

    const records = await HairAnalysis.findAll({
      where:  { customerId },
      order:  [["lastAnalysisAt", "DESC"]],
      limit:  10,
      attributes: [
        "idAnalysis", "faceShape", "skinToneUndertone", "skinType",
        "selectedHairstyleName", "lastAnalysisAt", "rating", "feedback",
      ],
    });

    return res.json(APIResponse.success({ history: records }));
  } catch (err) {
    console.error("Lỗi getMyHistory:", err);
    return res.status(500).json(
      APIResponse.error(err.message, null, "HISTORY_ERROR")
    );
  }
};

// =============================================
// GET /api/hair-analysis/stats   (Admin only)
// =============================================
export const getModelStats = async (req, res) => {
  try {
    const stats = await getAnalysisStats();
    return res.json(APIResponse.success(stats));
  } catch (err) {
    console.error("Lỗi getModelStats:", err);
    return res.status(500).json(
      APIResponse.error(err.message, null, "STATS_ERROR")
    );
  }
};

export default {
  saveAnalysisResult,
  rateAnalysisResult,

  getMyHistory,
  getModelStats,
};