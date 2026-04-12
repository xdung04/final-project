// api/src/migrations/20250101000011-create-booking-details.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("booking_details", {
    idBookingDetail: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    idBooking: {
      type: Sequelize.INTEGER,
      references: { model: "bookings", key: "idBooking" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    idService: {
      type: Sequelize.INTEGER,
      references: { model: "services", key: "idService" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    idBarber: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "barbers", key: "idBarber" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    quantity: { type: Sequelize.INTEGER, defaultValue: 1 },
    price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("booking_details");
}
