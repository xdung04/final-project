"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("compensation_plans", {
    idPlan: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    roleType: { type: Sequelize.STRING(50), allowNull: false }, // junior, senior, master...
    displayName: { type: Sequelize.STRING(100), allowNull: false },
    levelOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
    defaultBaseSalary: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
    nextIdPlan: { 
      type: Sequelize.INTEGER, 
      allowNull: true,
      // Tự tham chiếu tới chính bảng này (Cấp tiếp theo)
      references: { model: "compensation_plans", key: "idPlan" },
      onDelete: "SET NULL" 
    },
    minRevenueToPromote: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
    evaluationPeriodMonths: { type: Sequelize.INTEGER, defaultValue: 1 },
    minMonthsInLevel: { type: Sequelize.INTEGER, defaultValue: 0 },
    effectiveFrom: { type: Sequelize.DATEONLY, allowNull: false },
    effectiveTo: { type: Sequelize.DATEONLY, allowNull: true },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("compensation_plans");
}