// api/src/migrations/20250101000020-create-hashtags.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("hashtags", {
    idHashtag: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("hashtags");
}
