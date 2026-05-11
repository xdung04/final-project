// api/src/migrations/20250101000026-create-news.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("news", {
    idNews: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    title: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },

    slug: {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
    },

    thumbnail: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    summary: {
      type: Sequelize.TEXT,
      allowNull: true,
    },

    content: {
      type: Sequelize.TEXT("long"),
      allowNull: false,
    },

    category: {
      type: Sequelize.ENUM(
        "NEWS",
        "PROMOTION",
        "STYLE"
      ),
      defaultValue: "NEWS",
    },

    status: {
      type: Sequelize.ENUM(
        "DRAFT",
        "PUBLISHED"
      ),
      defaultValue: "DRAFT",
    },

    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },

    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("news");
}