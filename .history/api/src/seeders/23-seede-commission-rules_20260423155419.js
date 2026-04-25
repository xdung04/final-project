"use strict";

// ── Phụ thuộc: compensation_plans phải được seed trước ──────────────────────

export async function up(queryInterface) {
  await queryInterface.bulkInsert(
    "commission_rules",
    [
      // ════════════════════════════════════════════════════════════════════
      // PLAN 1 — Junior: Flat 15% toàn bộ (1 bậc duy nhất)
      // ════════════════════════════════════════════════════════════════════
      {
        idRule: 1,
        idPlan: 1,
        minRevenueStep: 0.00,
        maxRevenueStep: null,    // Vô cực
        commissionRate: 15.00,
        priority: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // PLAN 2 — Senior: Bậc thang 3 mức
      //   0        → 30 triệu  : 18%
      //   30 triệu → 50 triệu  : 20%
      //   50 triệu → ∞         : 22%
      // ════════════════════════════════════════════════════════════════════
      {
        idRule: 2,
        idPlan: 2,
        minRevenueStep: 0.00,
        maxRevenueStep: 30000000.00,
        commissionRate: 18.00,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        idRule: 3,
        idPlan: 2,
        minRevenueStep: 30000000.00,
        maxRevenueStep: 50000000.00,
        commissionRate: 20.00,
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        idRule: 4,
        idPlan: 2,
        minRevenueStep: 50000000.00,
        maxRevenueStep: null,    // Vô cực
        commissionRate: 22.00,
        priority: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // PLAN 3 — Master: Bậc thang 2 mức (luôn cao hơn Senior)
      //   0        → 50 triệu  : 22%
      //   50 triệu → ∞         : 25%
      // ════════════════════════════════════════════════════════════════════
      {
        idRule: 5,
        idPlan: 3,
        minRevenueStep: 0.00,
        maxRevenueStep: 50000000.00,
        commissionRate: 22.00,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        idRule: 6,
        idPlan: 3,
        minRevenueStep: 50000000.00,
        maxRevenueStep: null,    // Vô cực
        commissionRate: 25.00,
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    { ignoreDuplicates: true },
  );
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("commission_rules", {
    idRule: [1, 2, 3, 4, 5, 6],
  });
}