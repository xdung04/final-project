"use strict";
import moment from "moment";

export async function up(queryInterface, Sequelize) {
  const customerIds = [2, 3, 4, 5, 6, 7];
  const bookings = [];

  // Lấy chính xác 3 tháng trước theo chuẩn mùng 1 đến cuối tháng
  const evaluateMonths = [
    moment().subtract(3, 'months'),
    moment().subtract(2, 'months'),
    moment().subtract(1, 'months'),
  ];

  // Định mức doanh thu MỖI NGÀY cần đạt để pass/fail 30tr hoặc 50tr một tháng
  const testScenarios = [
    { idBarber: 15, dailyTarget: 1200000 }, // Case 1: ~36tr/tháng (Pass Doanh thu Senior)
    { idBarber: 17, dailyTarget: 1200000 }, // Case 2: ~36tr/tháng (Pass Doanh thu Senior, fail thâm niên)
    { idBarber: 19, dailyTarget: 500000 },  // Case 3: ~15tr/tháng (Fail Doanh thu Senior)
    { idBarber: 16, dailyTarget: 1800000 }, // Case 4: ~54tr/tháng (Pass Doanh thu Master)
  ];

  // Chạy vòng lặp bơm dữ liệu cho 3 tháng xét duyệt
  evaluateMonths.forEach((monthMoment) => {
    const daysInMonth = monthMoment.daysInMonth();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = monthMoment.clone().date(day).format("YYYY-MM-DD");

      testScenarios.forEach((scenario) => {
        const idCustomer = customerIds[Math.floor(Math.random() * customerIds.length)];
        
        // Chia dailyTarget làm 2 booking sáng và chiều để nhìn dữ liệu thực tế hơn
        bookings.push({
          idCustomer,
          idBarber: scenario.idBarber,
          idCustomerVoucher: null,
          guestCount: 1,
          bookingDate: currentDate,
          bookingTime: "10:00",
          status: "Completed",
          description: "Khách VIP test lên cấp",
          total: scenario.dailyTarget / 2, // Sẽ được chốt lại ở bảng details, nhưng cứ set cứng cho an toàn
          isPaid: true,
          createdAt: new Date(`${currentDate}T10:00:00`),
          updatedAt: new Date(`${currentDate}T10:00:00`),
        });

        bookings.push({
          idCustomer,
          idBarber: scenario.idBarber,
          idCustomerVoucher: null,
          guestCount: 1,
          bookingDate: currentDate,
          bookingTime: "16:00",
          status: "Completed",
          description: "Khách VIP test lên cấp",
          total: scenario.dailyTarget / 2,
          isPaid: true,
          createdAt: new Date(`${currentDate}T16:00:00`),
          updatedAt: new Date(`${currentDate}T16:00:00`),
        });
      });
    }
  });

  await queryInterface.bulkInsert("bookings", bookings);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("bookings", null, {});
}