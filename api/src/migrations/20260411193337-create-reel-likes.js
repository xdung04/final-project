// api/src/migrations/20250101000017-create-reel-likes.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("reel_likes", {
    idLike: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
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
    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("reel_likes");
}
