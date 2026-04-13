// api/src/migrations/20250101000002-create-branches.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("branches", {
    idBranch: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.STRING(100), allowNull: false },
    address: { type: Sequelize.STRING, allowNull: true },
    openTime: { type: Sequelize.TIME, allowNull: false },
    closeTime: { type: Sequelize.TIME, allowNull: false },
    slotDuration: { type: Sequelize.INTEGER, allowNull: false },
    status: { type: Sequelize.ENUM("Active", "Inactive"), defaultValue: "Active" },
    suspendDate: { type: Sequelize.DATEONLY, allowNull: true },
    resumeDate: { type: Sequelize.DATEONLY, allowNull: true },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("branches");
}
