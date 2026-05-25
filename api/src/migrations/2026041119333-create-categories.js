"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("categories", {
    idCategory: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.STRING(100), allowNull: false },
    slug: { type: Sequelize.STRING, allowNull: false, unique: true },
    status: { type: Sequelize.ENUM("Active", "Inactive"), defaultValue: "Active" },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
   await queryInterface.dropTable("hairstyles");
  await queryInterface.dropTable("categories");
}