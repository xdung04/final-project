"use strict";

export async function up(queryInterface) {

  // STEP 1: insert trước với idNextPlan = null
  await queryInterface.bulkInsert("compensation_plans", [
    {
      idPlan: 1,
      roleType: "junior",
      displayName: "Thợ Junior",
      levelOrder: 1,
      defaultBaseSalary: 3000000.00,
      idNextPlan: null,
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
      idNextPlan: null,
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
  ]);

  // STEP 2: update relationship sau
  await queryInterface.sequelize.query(`
    UPDATE compensation_plans
    SET idNextPlan = 2
    WHERE idPlan = 1
  `);

  await queryInterface.sequelize.query(`
    UPDATE compensation_plans
    SET idNextPlan = 3
    WHERE idPlan = 2
  `);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("compensation_plans", null, {});
}