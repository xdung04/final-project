"use strict";

import moment from "moment";

export async function up(queryInterface, Sequelize) {
  // Xóa dữ liệu liên quan trước để tránh lỗi khóa ngoại
  await queryInterface.bulkDelete("booking_details", null, {});
  await queryInterface.bulkDelete("booking_tips", null, {});
  await queryInterface.bulkDelete("bookings", null, {});

  const customerIds = [2, 3, 4, 5, 6, 7];

  const testScenarios = [
    { idBarber: 15, dailyTarget: 1200000 },
    { idBarber: 17, dailyTarget: 1200000 },
    { idBarber: 19, dailyTarget: 500000 },
    { idBarber: 16, dailyTarget: 1800000 },
  ];

  const evaluateMonths = [
    moment().subtract(3, "months"),
    moment().subtract(2, "months"),
    moment().subtract(1, "months"),
    moment(),
  ];

  const bookings = [];

  const shifts = [
    { time: "09:00" },
    { time: "11:00" },
    { time: "14:00" },
    { time: "16:30" },
    { time: "19:00" },
  ];

  const getRandomPayment = () =>
    Math.random() > 0.4 ? "Transfer" : "Cash";

  evaluateMonths.forEach((monthMoment) => {
    const daysInMonth = monthMoment.daysInMonth();

    const isCurrentMonth = monthMoment.isSame(moment(), "month");

    const limitDay = isCurrentMonth
      ? moment().date()
      : daysInMonth;

    for (let day = 1; day <= limitDay; day++) {
      const currentDate = monthMoment
        .clone()
        .date(day);

      const dateString = currentDate.format("YYYY-MM-DD");

      testScenarios.forEach((scenario) => {
        // Random số booking trong ngày
        const bookingCount =
          Math.floor(Math.random() * 3) + 2; // 2 -> 4 booking

        // Shuffle shifts
        const selectedShifts = [...shifts]
          .sort(() => 0.5 - Math.random())
          .slice(0, bookingCount);

        selectedShifts.forEach((shift) => {
          const total =
            scenario.dailyTarget / bookingCount +
            Math.floor(Math.random() * 100000);

          bookings.push({
            idCustomer:
              customerIds[
                Math.floor(Math.random() * customerIds.length)
              ],

            idBarber: scenario.idBarber,

            idCustomerVoucher: null,

            guestCount: 1,

            // Chỉ lưu ngày
            bookingDate: dateString,

            bookingTime: shift.time,

            status: "Completed",

            description: "Seeder dữ liệu test booking",

            total,

            isPaid: true,

            paymentMethod: getRandomPayment(),

            createdAt: new Date(
              `${dateString}T${shift.time}:00`
            ),

            updatedAt: new Date(
              `${dateString}T${shift.time}:00`
            ),
          });
        });
      });
    }
  });

  // Insert theo chunk
  const chunkSize = 300;

  for (let i = 0; i < bookings.length; i += chunkSize) {
    await queryInterface.bulkInsert(
      "bookings",
      bookings.slice(i, i + chunkSize),
      {}
    );
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("booking_details", null, {});
  await queryInterface.bulkDelete("booking_tips", null, {});
  await queryInterface.bulkDelete("bookings", null, {});
}