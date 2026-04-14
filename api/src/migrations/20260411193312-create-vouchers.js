// api/src/migrations/20250101000008-create-vouchers.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("vouchers", {
    idVoucher: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: Sequelize.STRING, allowNull: false },
    discountPercent: { type: Sequelize.DECIMAL(5, 2), allowNull: false },
    pointCost: { type: Sequelize.INTEGER, allowNull: false },
    totalQuantity: { type: Sequelize.INTEGER, allowNull: true },
    expiryDate: { type: Sequelize.DATE, allowNull: false },
    status: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    description: { type: Sequelize.STRING, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("vouchers");
}
