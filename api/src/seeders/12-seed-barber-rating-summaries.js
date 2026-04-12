"use strict";

export async function up(queryInterface, Sequelize) {
  const barbers = await queryInterface.sequelize.query(`SELECT idBarber FROM barbers`, {
    type: queryInterface.sequelize.QueryTypes.SELECT,
  });

  const ratingData = barbers.map((b) => ({
    idBarber: b.idBarber,
    totalRate: Math.floor(Math.random() * 50) + 10, // 10–60 lượt
    avgRate: parseFloat((Math.random() * 1.5 + 3.5).toFixed(2)), // 3.50–5.00
  }));

  if (ratingData.length > 0) {
    await queryInterface.bulkInsert("barber_rating_summaries", ratingData);
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("barber_rating_summaries", null, {});
}
