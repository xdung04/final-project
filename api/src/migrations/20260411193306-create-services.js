// api/src/migrations/20250101000006-create-services.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("services", {
    idService: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.STRING(100), allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: true },
    price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
    duration: { type: Sequelize.INTEGER, allowNull: false },
    image: { type: Sequelize.STRING(255), allowNull: true },
    status: { type: Sequelize.ENUM("Active", "Inactive"), defaultValue: "Active" },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("services");
}
