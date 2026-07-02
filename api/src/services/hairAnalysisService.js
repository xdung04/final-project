// services/hairAnalysisService.js
import { Op } from "sequelize";
import db from "../models/index.js";

const { HairAnalysis, sequelize } = db;

// =============================================
// SAVE — Lưu kết quả phân tích vào DB
// =============================================

/**
 * @param {number} customerId
 * @param {object} faceMetrics  - data gốc từ Python /predict
 * @param {string|null} selectedHairstyleName - kiểu tóc khách chọn (nếu có)
 */
export const saveAnalysis = async (customerId, faceMetrics, selectedHairstyleName = null) => {
  const { face_shape, skin_tone, skin_condition } = faceMetrics;

  const record = await HairAnalysis.create({
    customerId,
    faceShape:             face_shape?.predicted       || null,
    skinToneUndertone:     skin_tone?.undertone        || null,
    skinType:              skin_condition?.skin_type_vi || null,
    selectedHairstyleName: selectedHairstyleName,
    lastAnalysisAt:        new Date(),
    // rating & feedback để null — khách đánh giá sau
  });

  return record;
};

// =============================================
// RATE — Khách đánh giá sau khi xem/dùng kết quả
// =============================================

/**
 * @param {number} idAnalysis
 * @param {number} customerId  - chỉ chủ sở hữu mới rate được
 * @param {number} rating      - 1..5
 * @param {string|null} feedback
 */
export const rateAnalysis = async (idAnalysis, customerId, rating, feedback = null) => {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating phải là số nguyên từ 1 đến 5");
  }

  const record = await HairAnalysis.findOne({
    where: { idAnalysis, customerId },
  });

  if (!record) throw new Error("Không tìm thấy kết quả phân tích");

  await record.update({
    rating,
    feedback: feedback?.trim().slice(0, 255) || null,
  });

  return record;
};

// =============================================
// GET LATEST — Lấy phân tích gần nhất (dùng cho Booking)
// =============================================
export const getLatestAnalysis = async (customerId) => {
  return HairAnalysis.findOne({
    where: { customerId },
    order: [["lastAnalysisAt", "DESC"]],
  });
};

// =============================================
// STATS — Thống kê hiệu quả model (Admin)
// =============================================
export const getAnalysisStats = async () => {
  const [
    totalAnalyses,
    savedWithRating,
    ratingDistribution,
    avgRatingRow,
    recentFeedbacks,
    faceShapeBreakdown,
  ] = await Promise.all([

    HairAnalysis.count(),

    HairAnalysis.count({ where: { rating: { [Op.not]: null } } }),

    // Phân bố số sao 1–5
    HairAnalysis.findAll({
      where:      { rating: { [Op.not]: null } },
      attributes: [
        "rating",
        [sequelize.fn("COUNT", sequelize.col("rating")), "count"],
      ],
      group: ["rating"],
      raw:   true,
    }),

    // Rating trung bình
    HairAnalysis.findOne({
      where:      { rating: { [Op.not]: null } },
      attributes: [
        [sequelize.fn("AVG",   sequelize.col("rating")), "avgRating"],
        [sequelize.fn("COUNT", sequelize.col("rating")), "totalRated"],
      ],
      raw: true,
    }),

    // 20 feedback gần nhất có nội dung
    HairAnalysis.findAll({
      where: {
        feedback: { [Op.not]: null },
        rating:   { [Op.not]: null },
      },
      attributes: ["idAnalysis", "rating", "feedback", "faceShape", "lastAnalysisAt"],
      order: [["lastAnalysisAt", "DESC"]],
      limit: 20,
      raw:   true,
    }),

    // Breakdown theo từng khuôn mặt
    HairAnalysis.findAll({
      where:      { faceShape: { [Op.not]: null } },
      attributes: [
        "faceShape",
        [sequelize.fn("COUNT", sequelize.col("faceShape")), "count"],
        [sequelize.fn("AVG",   sequelize.col("rating")),    "avgRating"],
      ],
      group: ["faceShape"],
      raw:   true,
    }),
  ]);

  // Chuẩn hoá phân bố sao → { 1: 0, 2: 0, ... }
  const ratingMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingDistribution.forEach(r => {
    ratingMap[r.rating] = parseInt(r.count, 10);
  });

  const saveRate = totalAnalyses > 0
    ? Math.round((savedWithRating / totalAnalyses) * 100)
    : 0;

  return {
    summary: {
      totalAnalyses,
      savedWithRating,
      saveRate:   `${saveRate}%`,
      avgRating:  parseFloat(avgRatingRow?.avgRating || 0).toFixed(2),
      totalRated: parseInt(avgRatingRow?.totalRated  || 0, 10),
    },
    ratingDistribution: ratingMap,
    faceShapeBreakdown: faceShapeBreakdown.map(f => ({
      faceShape: f.faceShape,
      count:     parseInt(f.count, 10),
      avgRating: parseFloat(f.avgRating || 0).toFixed(2),
    })),
    recentFeedbacks,
  };
};