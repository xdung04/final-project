// api/src/migrations/20250101000025-create-notifications.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("notifications", {
    idNotification: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    type: { type: Sequelize.ENUM("BOOKING", "SALARY"), allowNull: false },
    title: { type: Sequelize.STRING(255), allowNull: false },
    content: { type: Sequelize.TEXT, allowNull: true },
    targetRole: { type: Sequelize.ENUM("customer", "barber"), allowNull: false },
    targetId: { type: Sequelize.INTEGER, allowNull: true },
    isRead: { type: Sequelize.BOOLEAN, defaultValue: false },
    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("notifications");
}
