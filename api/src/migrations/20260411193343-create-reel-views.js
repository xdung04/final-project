// api/src/migrations/20250101000019-create-reel-views.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable(
    "reel_views",
    {
      idReel: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: "reels", key: "idReel" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      idUser: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: "users", key: "idUser" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      lastViewedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    },
    { timestamps: false },
  );
}

export async function down(queryInterface) {
  await queryInterface.dropTable("reel_views");
}
