"use strict";

export async function up(queryInterface, Sequelize) {
  // Lấy bookings vừa tạo
  const bookings = await queryInterface.sequelize.query(
    `SELECT idBooking, total, bookingDate FROM bookings`,
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  );

  const bookingDetails = [];

  for (const booking of bookings) {
    // Để đảm bảo doanh thu khớp tuyệt đối với bài test Lên Cấp, 
    // chúng ta đẩy toàn bộ 'total' đã quy định vào 1 service tượng trưng.
    // (Service ID: 8 là gói mắc nhất, ta lợi dụng nó làm đại diện)
    
    bookingDetails.push({
      idBooking: booking.idBooking,
      idService: 8, 
      idBarber: null,
      quantity: 1,
      price: booking.total, // Ép giá dịch vụ bằng đúng tiền booking cần tạo
      createdAt: booking.bookingDate,
      updatedAt: booking.bookingDate,
    });
  }

  if (bookingDetails.length > 0) {
    await queryInterface.bulkInsert("booking_details", bookingDetails);
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("booking_details", null, {});
}