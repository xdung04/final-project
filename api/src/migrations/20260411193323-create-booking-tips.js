// api/src/migrations/20250101000012-create-booking-tips.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("booking_tips", {
    idTip: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    idBooking: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "bookings", key: "idBooking" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    idBarber: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "barbers", key: "idBarber" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    tipAmount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("booking_tips");
}
