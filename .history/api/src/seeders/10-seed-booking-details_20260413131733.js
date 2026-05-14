"use strict";

export async function up(queryInterface, Sequelize) {
  const now = new Date();

  const bookings = await queryInterface.sequelize.query(`SELECT idBooking, bookingDate FROM bookings`, {
    type: queryInterface.sequelize.QueryTypes.SELECT,
  });

  const services = [
    { idService: 1, price: 100000 },
    { idService: 2, price: 150000 },
    { idService: 3, price: 100000 },
    { idService: 4, price: 50000 },
    { idService: 5, price: 300000 },
    { idService: 6, price: 200000 },
    { idService: 7, price: 500000 },
    { idService: 8, price: 600000 },
  ];

  const bookingDetails = [];

  for (const booking of bookings) {
    const numServices = Math.floor(Math.random() * 3) + 1; // 1–3 dịch vụ
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

    // Cập nhật tổng tiền booking theo dịch vụ thực tế
    await queryInterface.sequelize.query(`UPDATE bookings SET total = ${total} WHERE idBooking = ${booking.idBooking}`);
  }

  if (bookingDetails.length > 0) {
    await queryInterface.bulkInsert("booking_details", bookingDetails);
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("booking_details", null, {});
}
