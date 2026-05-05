"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("salary_deductions", {
    idDeduction: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idSalary: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "salaries", key: "idSalary" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    reason: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    violationDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: "Ngày xảy ra vi phạm. Nullable vì tạm ứng không có ngày vi phạm cụ thể",
    },
    deletedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    deleteReason: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("salary_deductions");
}