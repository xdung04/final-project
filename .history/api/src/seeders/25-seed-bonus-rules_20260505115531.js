"use strict";

export async function up(queryInterface) {
  await queryInterface.bulkInsert(
    "bonus_rules",
    [
      // ════════════════════════════════════════════════════════════════════
      // PLAN 1 — Junior
      // ════════════════════════════════════════════════════════════════════
      {
        idBonus: 1,
        idPlan: 1,
        bonusName: "Thưởng Chất Lượng Junior",
        minCustomerCount: 80,
        minAverageRating: 4.50,
        rewardAmount: 500000.00,
        evaluationPeriodMonths: 1,  // ✅ 1 tháng
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // PLAN 2 — Senior
      // ════════════════════════════════════════════════════════════════════
      {
        idBonus: 2,
        idPlan: 2,
        bonusName: "Thưởng Chất Lượng Senior",
        minCustomerCount: 120,
        minAverageRating: 4.70,
        rewardAmount: 1000000.00,
        evaluationPeriodMonths: 1,  // ✅ 1 tháng
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        idBonus: 3,
        idPlan: 2,
        bonusName: "Thưởng Vượt Chỉ Tiêu Senior",
        minCustomerCount: 150,
        minAverageRating: 4.80,
        rewardAmount: 500000.00,
        evaluationPeriodMonths: 1,  // ✅ 1 tháng
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // PLAN 3 — Master
      // ════════════════════════════════════════════════════════════════════
      {
        idBonus: 4,
        idPlan: 3,
        bonusName: "Thưởng Master Elite",
        minCustomerCount: 160,
        minAverageRating: 4.80,
        rewardAmount: 1500000.00,
        evaluationPeriodMonths: 1,  // ✅ 1 tháng
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        idBonus: 5,
        idPlan: 3,
        bonusName: "Thưởng Master Xuất Sắc",
        minCustomerCount: 180,
        minAverageRating: 4.90,
        rewardAmount: 1000000.00,
        evaluationPeriodMonths: 1,  // ✅ 1 tháng
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    { ignoreDuplicates: true },
  );
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("bonus_rules", { idBonus: [1, 2, 3, 4, 5] });
}