"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("UserGoogleCalendars", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "idUser",
      },
      onDelete: "CASCADE",
    },
    googleEmail: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    accessToken: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    refreshToken: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    expiry: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });

  await queryInterface.addIndex("UserGoogleCalendars", ["userId"]);
}

export async function down(queryInterface) {
  await queryInterface.dropTable("UserGoogleCalendars");
}