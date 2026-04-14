// api/src/migrations/20250101000026-create-banners.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("banners", {
    idBanner: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    title: { type: Sequelize.STRING(255), allowNull: true },
    imageUrl: { type: Sequelize.STRING, allowNull: false },
    linkUrl: { type: Sequelize.STRING, allowNull: true },
    startAt: { type: Sequelize.DATE, allowNull: true },
    endAt: { type: Sequelize.DATE, allowNull: true },
    isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("banners");
}
