"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("customer_galleries", {
    idImage: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    idBooking: {
      type: Sequelize.INTEGER,
      references: { model: "bookings", key: "idBooking" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    uploadBy: {
      type: Sequelize.INTEGER,
      allowNull: true, // ← thêm allowNull: true
      references: { model: "barbers", key: "idBarber" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    imageUrl: { type: Sequelize.STRING, allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: true },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("customer_galleries");
}
