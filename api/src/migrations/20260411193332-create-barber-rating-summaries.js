// api/src/migrations/20250101000015-create-barber-rating-summaries.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("barber_rating_summaries", {
    idBarber: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: { model: "barbers", key: "idBarber" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    totalRate: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    avgRate: { type: Sequelize.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("barber_rating_summaries");
}
