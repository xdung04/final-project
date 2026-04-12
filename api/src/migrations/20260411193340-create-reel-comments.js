// api/src/migrations/20250101000018-create-reel-comments.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("reel_comments", {
    idComment: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    idReel: {
      type: Sequelize.INTEGER,
      references: { model: "reels", key: "idReel" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    idUser: {
      type: Sequelize.INTEGER,
      references: { model: "users", key: "idUser" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    parentCommentId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "reel_comments", key: "idComment" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    content: { type: Sequelize.TEXT, allowNull: false },
    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("reel_comments");
}
