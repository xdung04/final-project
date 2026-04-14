// api/src/migrations/20250101000021-create-reel-hashtags.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("reel_hashtags", {
    idReel: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "reels", key: "idReel" },
      onDelete: "CASCADE",
    },
    idHashtag: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "hashtags", key: "idHashtag" },
      onDelete: "CASCADE",
    },
    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("reel_hashtags");
}
