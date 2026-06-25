// api/src/migrations/20250101000023-create-loyalty-rules.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("loyalty_rules", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.STRING, allowNull: true },
    money_per_point: { type: Sequelize.INTEGER, allowNull: false },
    point_multiplier: { type: Sequelize.DECIMAL(4, 2), allowNull: false, defaultValue: 1.0 },
    min_order_amount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    is_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    start_date: { type: Sequelize.DATE, allowNull: true },
    end_date: { type: Sequelize.DATE, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("loyalty_rules");
}
