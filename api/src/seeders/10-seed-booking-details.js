"use strict";

export async function up(queryInterface, Sequelize) {
  const bookings = await queryInterface.sequelize.query(
    `SELECT idBooking, total, bookingDate FROM bookings`,
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  );

  const details = bookings.map(b => ({
    idBooking: b.idBooking,
    idService: 8,
    idBarber: null,
    quantity: 1,
    price: b.total,
    createdAt: b.bookingDate,
    updatedAt: b.bookingDate,
  }));

  const chunkSize = 500;
  for (let i = 0; i < details.length; i += chunkSize) {
    await queryInterface.bulkInsert("booking_details", details.slice(i, i + chunkSize));
  }
  console.log(`✅ Seeded ${details.length} booking_details records`);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("booking_details", null, {});
}