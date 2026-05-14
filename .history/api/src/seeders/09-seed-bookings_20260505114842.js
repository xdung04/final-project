"use strict";

export async function up(queryInterface, Sequelize) {
  const now = new Date();

  const customerIds = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  // barber → branch map để lấy giờ mở/đóng
  const barberBranch = {
    15: 1, 16: 1, 17: 1,
    18: 2, 19: 2, 20: 2,
    21: 3, 22: 3, 23: 3,
  };
  const barberIds = Object.keys(barberBranch).map(Number);

  const branches = {
    1: { openTime: "08:00", closeTime: "21:00", slotDuration: 60 },
    2: { openTime: "08:00", closeTime: "21:00", slotDuration: 60 },
    3: { openTime: "08:00", closeTime: "21:00", slotDuration: 60 },
  };

  // Ngày bắt đầu: 01/01/2025
  const startDate = new Date("2026-01-01");
  // Ngày kết thúc: hôm nay (12/04/2026)
  const endDate = new Date();
  const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

  const bookings = [];
  const TOTAL_BOOKINGS = 800;

  for (let i = 0; i < TOTAL_BOOKINGS; i++) {
    // Random ngày trong khoảng
    const randomDayOffset = Math.floor(Math.random() * totalDays);
    const bookingDate = new Date(startDate);
    bookingDate.setDate(startDate.getDate() + randomDayOffset);

    // Random barber & customer
    const barberId = barberIds[Math.floor(Math.random() * barberIds.length)];
    const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
    const branchId = barberBranch[barberId];
    const branch = branches[branchId];

    // Tính slot giờ
    const [openH, openM] = branch.openTime.split(":").map(Number);
    const [closeH, closeM] = branch.closeTime.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    const totalSlots = Math.floor((closeMinutes - openMinutes) / branch.slotDuration);
    const slotIndex = Math.floor(Math.random() * totalSlots);
    const bookingMinutes = openMinutes + slotIndex * branch.slotDuration;
    const hour = Math.floor(bookingMinutes / 60);
    const minute = bookingMinutes % 60;
    const bookingTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

    const total = (Math.floor(Math.random() * 10) + 1) * 50000 + 100000; // 150k → 600k

    bookings.push({
      idCustomer: customerId,
      idBarber: barberId,
      idCustomerVoucher: null,
      guestCount: 1,
      bookingDate,
      bookingTime,
      status: "Completed",
      description: `Hoàn tất lúc ${bookingTime} ngày ${bookingDate.toISOString().split("T")[0]}`,
      total,
      isPaid: true,
      createdAt: bookingDate,
      updatedAt: bookingDate,
    });
  }

  await queryInterface.bulkInsert("bookings", bookings);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("bookings", null, {});
}