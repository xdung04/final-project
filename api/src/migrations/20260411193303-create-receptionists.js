// api/src/migrations/20250101000005-create-receptionists.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("receptionists", {
    idReceptionist: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: { model: "users", key: "idUser" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    idBranch: {
      type: Sequelize.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: "branches", key: "idBranch" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("receptionists");
}
