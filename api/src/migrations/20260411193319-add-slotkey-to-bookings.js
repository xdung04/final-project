"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("bookings", "slotKey", {
    type: Sequelize.STRING,
    unique: true,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("bookings", "slotKey");
}