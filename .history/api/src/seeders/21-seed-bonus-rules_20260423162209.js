"use strict";

// ── Phụ thuộc: compensation_plans phải được seed trước ──────────────────────

export async function up(queryInterface) {
  await queryInterface.bulkInsert(
    "bonus_rules",
    [
      // ════════════════════════════════════════════════════════════════════
      // PLAN 1 — Junior
      // Điều kiện dễ hơn để khuyến khích thợ mới
      // ════════════════════════════════════════════════════════════════════
      {
        idBonus: 1,
        idPlan: 1,
        bonusName: "Thưởng Chất Lượng Junior",
        // Phải đạt CẢ HAI: >= 200 khách VÀ rating >= 4.50
        minCustomerCount: 200,
        minAverageRating: 4.50,
        rewardAmount: 500000.00,
        evaluationPeriodMonths: 1,   // Đánh giá mỗi tháng
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // PLAN 2 — Senior
      // Target cao hơn Junior, thưởng cao hơn
      // ════════════════════════════════════════════════════════════════════
      {
        idBonus: 2,
        planId: 2,
        bonusName: "Thưởng Chất Lượng Senior",
        // Phải đạt CẢ HAI: >= 250 khách VÀ rating >= 4.70
        minCustomerCount: 250,
        minAverageRating: 4.70,
        rewardAmount: 1000000.00,
        evaluationPeriodMonths: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        idBonus: 3,
        planId: 2,
        bonusName: "Thưởng Duy Trì 3 Tháng",
        // Bonus thêm nếu duy trì chất lượng liên tục 3 tháng
        minCustomerCount: 230,
        minAverageRating: 4.60,
        rewardAmount: 500000.00,
        evaluationPeriodMonths: 3,   // Đánh giá trung bình 3 tháng
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // PLAN 3 — Master
      // Target cao nhất, thưởng cao nhất
      // ════════════════════════════════════════════════════════════════════
      {
        idBonus: 4,
        planId: 3,
        bonusName: "Thưởng Master Elite",
        // Phải đạt CẢ HAI: >= 300 khách VÀ rating >= 4.80
        minCustomerCount: 300,
        minAverageRating: 4.80,
        rewardAmount: 1500000.00,
        evaluationPeriodMonths: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        idBonus: 5,
        planId: 3,
        bonusName: "Thưởng Master Xuất Sắc",
        // Gói thưởng đặc biệt cho Master duy trì 3 tháng liên tiếp
        minCustomerCount: 280,
        minAverageRating: 4.75,
        rewardAmount: 1000000.00,
        evaluationPeriodMonths: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    { ignoreDuplicates: true },
  );
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("bonus_rules", {
    idBonus: [1, 2, 3, 4, 5],
  });
}