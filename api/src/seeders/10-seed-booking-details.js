"use strict";

export async function up(queryInterface, Sequelize) {
  const bookings = await queryInterface.sequelize.query(
    `SELECT idBooking, bookingDate FROM bookings ORDER BY bookingDate`,
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  );

  const services = [
    { idService: 1, price: 120000 },
    { idService: 2, price: 180000 },
    { idService: 3, price: 95000 },
    { idService: 4, price: 65000 },
    { idService: 5, price: 350000 },
    { idService: 6, price: 250000 },
    { idService: 7, price: 550000 },
    { idService: 8, price: 680000 },
  ];

  const bookingDetails = [];

  for (const booking of bookings) {
    const numServices = Math.random() > 0.6 ? 2 : Math.random() > 0.3 ? 3 : 1;
    const shuffled = [...services].sort(() => 0.5 - Math.random());
    const chosen = shuffled.slice(0, numServices);

    let total = 0;

    for (const svc of chosen) {
      bookingDetails.push({
        idBooking: booking.idBooking,
        idService: svc.idService,
        idBarber: null,
        quantity: 1,
        price: svc.price,
        createdAt: booking.bookingDate,
        updatedAt: booking.bookingDate,
      });
      total += svc.price;
    }

    await queryInterface.sequelize.query(
      `UPDATE bookings SET total = ${total} WHERE idBooking = ${booking.idBooking}`
    );
  }

  if (bookingDetails.length > 0) {
    await queryInterface.bulkInsert("booking_details", bookingDetails);
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("booking_details", null, {});
}