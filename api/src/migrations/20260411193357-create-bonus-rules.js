// api/src/migrations/20250101000024-create-bonus-rules.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("BonusRules", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    minRevenue: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
    bonusPercent: { type: Sequelize.DECIMAL(5, 2), allowNull: false },
    note: { type: Sequelize.STRING, allowNull: true },
    active: { type: Sequelize.BOOLEAN, defaultValue: true },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("BonusRules");
}
