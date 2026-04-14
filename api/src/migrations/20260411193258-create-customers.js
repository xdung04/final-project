// api/src/migrations/20250101000003-create-customers.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("customers", {
    idCustomer: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      references: { model: "users", key: "idUser" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    loyaltyPoint: { type: Sequelize.INTEGER, defaultValue: 0 },
    address: { type: Sequelize.STRING, allowNull: true },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("customers");
}
