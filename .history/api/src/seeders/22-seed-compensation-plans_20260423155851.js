"use strict";

export async function up(queryInterface) {
  await queryInterface.bulkInsert(
    "compensation_plans",
    [
      // ── Cấp 1: Junior ────────────────────────────────────────────────────
      {
        idPlan: 1,
        roleType: "junior",
        displayName: "Thợ Junior",
        levelOrder: 1,
        defaultBaseSalary: 3000000.00,
        idNextPlan: 2,                    // Lên Senior
        minRevenueToPromote: 30000000.00, // 30 triệu/tháng
        evaluationPeriodMonths: 3,        // Đạt liên tục 3 tháng
        minMonthsInLevel: 6,              // Ở Junior ít nhất 6 tháng
        effectiveFrom: "2025-01-01",
        effectiveTo: null,                // Đang áp dụng
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ── Cấp 2: Senior ────────────────────────────────────────────────────
      {
        idPlan: 2,
        roleType: "senior",
        displayName: "Thợ Senior",
        levelOrder: 2,
        defaultBaseSalary: 4500000.00,
        nextIdPlan: 3,                    // Lên Master
        minRevenueToPromote: 50000000.00, // 50 triệu/tháng
        evaluationPeriodMonths: 3,
        minMonthsInLevel: 12,             // Ở Senior ít nhất 12 tháng
        effectiveFrom: "2025-01-01",
        effectiveTo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ── Cấp 3: Master ────────────────────────────────────────────────────
      {
        idPlan: 3,
        roleType: "master",
        displayName: "Thợ Master",
        levelOrder: 3,
        defaultBaseSalary: 6000000.00,
        idNextPlan: null,                 // Cấp cao nhất
        minRevenueToPromote: null,
        evaluationPeriodMonths: null,
        minMonthsInLevel: null,
        effectiveFrom: "2025-01-01",
        effectiveTo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ── Lịch sử: Junior (Chính sách cũ 2024) ─────────────────────────────
      // SCD Type 2: Plan cũ đã đóng, dùng để audit
      {
        idPlan: 4,
        roleType: "junior",
        displayName: "Thợ Junior (2024)",
        levelOrder: 1,
        defaultBaseSalary: 2500000.00,
        idNextPlan: null,
        minRevenueToPromote: 25000000.00,
        evaluationPeriodMonths: 3,
        minMonthsInLevel: 6,
        effectiveFrom: "2024-01-01",
        effectiveTo: "2024-12-31",        // Đã đóng
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    { ignoreDuplicates: true },
  );
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("compensation_plans", {
    idPlan: [1, 2, 3, 4],
  });
}