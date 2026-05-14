"use strict";

// ── Commission Rules — 3 bậc mỗi plan, tỉ lệ thực tế hơn ───────────────────
//
// Junior  : 8%  → 10% → 12%   (doanh thu thấp, đang học việc)
// Senior  : 10% → 12% → 14%   (doanh thu trung bình, đã ổn định)
// Master  : 12% → 15% → 18%   (doanh thu cao, thưởng xứng đáng)
//
// Mốc doanh thu (thực tế barber salon):
//   Thấp  : 0      → 20 triệu
//   Trung : 20 triệu → 40 triệu
//   Cao   : 40 triệu → ∞

export async function up(queryInterface) {
  await queryInterface.bulkInsert(
    "commission_rules",
    [
      // ════════════════════════════════════════════════════════════════════
      // PLAN 1 — Junior: 3 bậc, 8% → 10% → 12%
      // ════════════════════════════════════════════════════════════════════
      {
        idRule: 1, idPlan: 1,
        minRevenueStep:  0.00,
        maxRevenueStep:  20000000.00,  // 0 → 20tr
        commissionRate:  8.00,
        priority: 1,
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        idRule: 2, idPlan: 1,
        minRevenueStep:  20000000.00,
        maxRevenueStep:  40000000.00,  // 20tr → 40tr
        commissionRate:  10.00,
        priority: 2,
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        idRule: 3, idPlan: 1,
        minRevenueStep:  40000000.00,
        maxRevenueStep:  null,         // 40tr → ∞
        commissionRate:  12.00,
        priority: 3,
        createdAt: new Date(), updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // PLAN 2 — Senior: 3 bậc, 10% → 12% → 14%
      // ════════════════════════════════════════════════════════════════════
      {
        idRule: 4, idPlan: 2,
        minRevenueStep:  0.00,
        maxRevenueStep:  20000000.00,  // 0 → 20tr
        commissionRate:  10.00,
        priority: 1,
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        idRule: 5, idPlan: 2,
        minRevenueStep:  20000000.00,
        maxRevenueStep:  40000000.00,  // 20tr → 40tr
        commissionRate:  12.00,
        priority: 2,
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        idRule: 6, idPlan: 2,
        minRevenueStep:  40000000.00,
        maxRevenueStep:  null,         // 40tr → ∞
        commissionRate:  14.00,
        priority: 3,
        createdAt: new Date(), updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // PLAN 3 — Master: 3 bậc, 12% → 15% → 18%
      // ════════════════════════════════════════════════════════════════════
      {
        idRule: 7, idPlan: 3,
        minRevenueStep:  0.00,
        maxRevenueStep:  20000000.00,  // 0 → 20tr
        commissionRate:  12.00,
        priority: 1,
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        idRule: 8, idPlan: 3,
        minRevenueStep:  20000000.00,
        maxRevenueStep:  40000000.00,  // 20tr → 40tr
        commissionRate:  15.00,
        priority: 2,
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        idRule: 9, idPlan: 3,
        minRevenueStep:  40000000.00,
        maxRevenueStep:  null,         // 40tr → ∞
        commissionRate:  18.00,
        priority: 3,
        createdAt: new Date(), updatedAt: new Date(),
      },
    ],
    { ignoreDuplicates: true },
  );
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("commission_rules", {
    idRule: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  });
}