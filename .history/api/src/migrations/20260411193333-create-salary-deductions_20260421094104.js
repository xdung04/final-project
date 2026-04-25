// api/src/migrations/20250101000014-create-salary-deductions.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("salary_deductions", {
    idDeduction: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    idSalary: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "salaries", key: "idSalary" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE", // Quan trọng: Nếu xóa phiếu lương thì xóa luôn chi tiết khấu trừ
    },
    amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    reason: { type: Sequelize.STRING, allowNull: false },
    type: { type: Sequelize.STRING, allowNull: true }, // VD: "Tạm ứng", "Phạt", "Khác"

    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("salary_deductions");
}