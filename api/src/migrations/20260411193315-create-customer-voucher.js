// api/src/migrations/20250101000009-create-customer-voucher.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("customer_voucher", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    idCustomer: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "customers", key: "idCustomer" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    idVoucher: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "vouchers", key: "idVoucher" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    voucherCode: { type: Sequelize.STRING, allowNull: false, unique: true },
    obtainedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    usedAt: { type: Sequelize.DATE, allowNull: true },
    expiredAt: { type: Sequelize.DATE, allowNull: true },
    status: { type: Sequelize.ENUM("unused", "used", "expired"), allowNull: false, defaultValue: "unused" },
    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("customer_voucher");
}
