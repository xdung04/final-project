"use strict";

export async function up(queryInterface, Sequelize) {
  const bookings = await queryInterface.sequelize.query(
    `SELECT idBooking, idBarber, bookingDate FROM bookings WHERE isPaid = true`,
    { type: queryInterface.sequelize.QueryTypes.SELECT },
  );

  // Chỉ ~40% booking có tip
  const tippedBookings = bookings.filter(() => Math.random() < 0.4);

  const tips = tippedBookings.map((b) => ({
    idBooking: b.idBooking,
    idBarber: b.idBarber,
    tipAmount: (Math.floor(Math.random() * 8) + 2) * 10000, // 20k → 100k
    createdAt: b.bookingDate,
    updatedAt: b.bookingDate,
  }));

  if (tips.length > 0) {
    await queryInterface.bulkInsert("booking_tips", tips);
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("booking_tips", null, {});
}
