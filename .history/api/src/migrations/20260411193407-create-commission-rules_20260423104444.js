"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("commission_rules", {
    ruleId: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    planId: { 
      type: Sequelize.INTEGER, 
      allowNull: false,
      references: { model: "compensation_plans", key: "planId" },
      onDelete: "CASCADE" // Xóa plan là mất luôn rule
    },
    minRevenueStep: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    maxRevenueStep: { type: Sequelize.DECIMAL(12, 2), allowNull: true }, // null = Vô cực
    commissionRate: { type: Sequelize.DECIMAL(5, 2), allowNull: false }, // 15.50 %
    priority: { type: Sequelize.INTEGER, defaultValue: 0 },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("commission_rules");
}