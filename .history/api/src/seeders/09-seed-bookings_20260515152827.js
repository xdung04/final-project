"use strict";
import moment from "moment";

export async function up(queryInterface, Sequelize) {
  // 1. Dọn dẹp dữ liệu cũ trước khi chèn mới để tránh lỗi hoặc rác dữ liệu
  await queryInterface.bulkDelete("bookings", null, {});

  const customerIds = [2, 3, 4, 5, 6, 7];
  const bookings = [];

  // Lấy danh sách các tháng cần tạo dữ liệu (3 tháng trước + tháng hiện tại)
  const evaluateMonths = [
    moment().subtract(3, 'months'),
    moment().subtract(2, 'months'),
    moment().subtract(1, 'months'),
    moment(), 
  ];

  const testScenarios = [
    { idBarber: 15, dailyTarget: 1200000 }, // ~36tr/tháng
    { idBarber: 17, dailyTarget: 1200000 }, 
    { idBarber: 19, dailyTarget: 500000 },  // ~15tr/tháng
    { idBarber: 16, dailyTarget: 1800000 }, // ~54tr/tháng
  ];

  evaluateMonths.forEach((monthMoment) => {
    const daysInMonth = monthMoment.daysInMonth();
    const isCurrentMonth = monthMoment.isSame(moment(), 'month');
    
    // Nếu là tháng hiện tại, chỉ tạo đến ngày hôm nay
    const limitDay = isCurrentMonth ? moment().date() : daysInMonth;

    for (let day = 1; day <= limitDay; day++) {
      // Tạo một đối tượng moment cho ngày cụ thể
      const currentMoment = monthMoment.clone().date(day);
      const dateString = currentMoment.format("YYYY-MM-DD");

      testScenarios.forEach((scenario) => {
        const idCustomer = customerIds[Math.floor(Math.random() * customerIds.length)];
        const getRandomMethod = () => (Math.random() > 0.4 ? "Transfer" : "Cash");

        // Mỗi ngày 2 ca: Sáng và Chiều
        const shifts = [
          { time: "10:00", suffix: "T10:00:00" },
          { time: "16:30", suffix: "T16:30:00" }
        ];

        shifts.forEach(shift => {
          const timestamp = new Date(`${dateString}${shift.suffix}`);
          
          bookings.push({
            idCustomer,
            idBarber: scenario.idBarber,
            idCustomerVoucher: null, // null vì booking không dùng voucher
            guestCount: 1,
            bookingDate: timestamp, // Sử dụng Date object thay vì string YYYY-MM-DD
            bookingTime: shift.time,
            status: "Completed",
            description: "Dữ liệu test hệ thống",
            total: scenario.dailyTarget / 2,
            isPaid: true,
            paymentMethod: getRandomMethod(),
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        });
      });
    }
  });

  // Chia nhỏ để insert để tránh quá tải query (Bulk insert)
  const chunkSize = 200;
  for (let i = 0; i < bookings.length; i += chunkSize) {
    await queryInterface.bulkInsert("bookings", bookings.slice(i, i + chunkSize));
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("bookings", null, {});
}