"use strict";

export async function up(queryInterface) {
  await queryInterface.bulkInsert("compensation_plans", [
    {
      idPlan: 1, 
      roleType: "junior", 
      displayName: "Thợ Junior", 
      levelOrder: 1,
      defaultBaseSalary: 3000000.00, 
      idNextPlan: 2,
      minRevenueToPromote: 30000000.00, 
      evaluationPeriodMonths: 3, 
      minMonthsInLevel: 6,
      effectiveFrom: "2025-01-01", 
      effectiveTo: null,
      createdAt: new Date(), 
      updatedAt: new Date(),
    },
    {
      idPlan: 2, 
      roleType: "senior", 
      displayName: "Thợ Senior", 
      levelOrder: 2,
      defaultBaseSalary: 4500000.00, 
      idNextPlan: 3,
      minRevenueToPromote: 50000000.00, 
      evaluationPeriodMonths: 3, 
      minMonthsInLevel: 12,
      effectiveFrom: "2025-01-01", 
      effectiveTo: null,
      createdAt: new Date(), 
      updatedAt: new Date(),
    },
    {
      idPlan: 3, 
      roleType: "master", 
      displayName: "Thợ Master", 
      levelOrder: 3,
      defaultBaseSalary: 6000000.00, 
      idNextPlan: null,
      minRevenueToPromote: null, 
      evaluationPeriodMonths: null, 
      minMonthsInLevel: null,
      effectiveFrom: "2025-01-01", 
      effectiveTo: null,
      createdAt: new Date(), 
      updatedAt: new Date(),
    },
    {
      // SCD Type 2: plan cũ 2024 đã đóng, dùng để audit lịch sử lương
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
      effectiveTo: "2024-12-31",
      createdAt: new Date(), 
      updatedAt: new Date(),
    },
  ], {}); // Đã bỏ ignoreDuplicates để tracking lỗi chuẩn chỉnh
}

export async function down(queryInterface) {
  // Clear sạch bảng và reset Auto-Increment về lại 1
  await queryInterface.sequelize.query("TRUNCATE TABLE compensation_plans RESTART IDENTITY CASCADE;");
}