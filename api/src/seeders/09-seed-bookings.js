"use strict";

export async function up(queryInterface, Sequelize) {
  const barberBranch = { 15:1,16:1,17:1,18:2,19:2,20:2,21:3,22:3,23:3 };
  const barberIds = Object.keys(barberBranch).map(Number);

  const branches = {
    1: { openTime: "08:00", closeTime: "21:00", slotDuration: 60 },
    2: { openTime: "08:00", closeTime: "21:00", slotDuration: 60 },
    3: { openTime: "08:00", closeTime: "21:00", slotDuration: 60 },
  };

  const startDate = new Date("2025-01-01");
  const endDate = new Date("2026-05-10");
  const totalDays = Math.floor((endDate - startDate) / 86400000);

  const bookings = [];
  const TOTAL_BOOKINGS = 680;

  // === PHÂN BỐ PATTERN THEO KHÁCH HÀNG ===
  const customerPatterns = [
    { id: 2,  type: "regular",    count: 68 },   // Regular
    { id: 3,  type: "regular",    count: 62 },
    { id: 4,  type: "regular",    count: 71 },

    { id: 5,  type: "occasional", count: 12 },   // Occasional
    { id: 6,  type: "occasional", count: 9 },

    { id: 7,  type: "new",        count: 4 },    // New
    { id: 8,  type: "new",        count: 3 },

    { id: 9,  type: "inactive",   count: 15 },   // Inactive (cũ)
    { id: 10, type: "inactive",   count: 11 },

    { id: 11, type: "walkin",     count: 1 },    // Walk-in
    { id: 12, type: "walkin",     count: 1 },
  ];

  for (const cust of customerPatterns) {
    let bookingCount = cust.count;

    for (let i = 0; i < bookingCount; i++) {
      const barberId = barberIds[Math.floor(Math.random() * barberIds.length)];
      const branchId = barberBranch[barberId];
      const branch = branches[branchId];

      let bookingDate = new Date(startDate);
      let offset;

      switch (cust.type) {
        case "regular":
          offset = Math.floor(Math.random() * totalDays * 0.9);
          break;
        case "occasional":
          offset = Math.floor(Math.random() * totalDays);
          break;
        case "new":
          offset = totalDays - Math.floor(Math.random() * 35); // Trong 35 ngày gần nhất
          break;
        case "inactive":
          offset = Math.floor(Math.random() * (totalDays * 0.6)); // Cũ hơn
          break;
        case "walkin":
          offset = totalDays - Math.floor(Math.random() * 20); // Rất mới
          break;
      }

      bookingDate.setDate(startDate.getDate() + offset);

      // Tạo giờ booking
      const [openH] = branch.openTime.split(":").map(Number);
      const totalHours = 13;
      const hour = openH + Math.floor(Math.random() * totalHours);
      const minute = Math.random() > 0.5 ? "00" : "30";
      const bookingTime = `${hour.toString().padStart(2, "0")}:${minute}`;

      const total = Math.floor(Math.random() * 480000) + 150000;

      bookings.push({
        idCustomer: cust.id,
        idBarber: barberId,
        idCustomerVoucher: null,
        guestCount: 1,
        bookingDate,
        bookingTime,
        status: "Completed",
        total,
        isPaid: true,
        createdAt: bookingDate,
        updatedAt: bookingDate,
      });
    }
  }

  await queryInterface.bulkInsert("bookings", bookings);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("bookings", null, {});
}