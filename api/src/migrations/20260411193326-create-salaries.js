// api/src/migrations/20250101000013-create-salaries.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("salaries", {
    idSalary: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    idBarber: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "barbers", key: "idBarber" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    month: { type: Sequelize.INTEGER, allowNull: false },
    year: { type: Sequelize.INTEGER, allowNull: false },
    baseSalary: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    commission: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    tips: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    bonus: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    totalSalary: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    status: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("salaries");
}
