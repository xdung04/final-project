// api/src/migrations/20250101000016-create-reels.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("reels", {
    idReel: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    idBarber: {
      type: Sequelize.INTEGER,
      references: { model: "barbers", key: "idBarber" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    title: { type: Sequelize.STRING(150), allowNull: false },
    url: { type: Sequelize.STRING, allowNull: false },
    thumbnail: { type: Sequelize.STRING, allowNull: true },
    description: { type: Sequelize.TEXT, allowNull: true },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("reels");
}
