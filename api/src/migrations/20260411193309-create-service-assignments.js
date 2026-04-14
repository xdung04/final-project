// api/src/migrations/20250101000007-create-service-assignments.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("service_assignments", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    idBranch: {
      type: Sequelize.INTEGER,
      references: { model: "branches", key: "idBranch" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    idService: {
      type: Sequelize.INTEGER,
      references: { model: "services", key: "idService" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("service_assignments");
}
