"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("bonus_rules", {
    idBonus: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    planId: { 
      type: Sequelize.INTEGER, 
      allowNull: false,
      references: { model: "compensation_plans", key: "idPlan" },
      onDelete: "CASCADE"
    },
    bonusName: { type: Sequelize.STRING(150), allowNull: false },
    minCustomerCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    minAverageRating: { type: Sequelize.DECIMAL(3, 2), allowNull: false, defaultValue: 0.00 }, // 4.50
    rewardAmount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
    evaluationPeriodMonths: { type: Sequelize.INTEGER, defaultValue: 1 },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("bonus_rules");
}