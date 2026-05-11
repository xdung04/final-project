"use strict";
import moment from "moment";

export async function up(queryInterface, Sequelize) {
  const customerIds = [2, 3, 4, 5, 6, 7];
  const bookings = [];

  // Lấy chính xác 3 tháng trước
  const evaluateMonths = [
    moment().subtract(3, 'months'),
    moment().subtract(2, 'months'),
    moment().subtract(1, 'months'),
    moment(), // Thêm cả tháng hiện tại để Lễ tân có dữ liệu hiển thị "Trong ngày"
  ];

  // Các kịch bản test của bạn
  const testScenarios = [
    { idBarber: 15, dailyTarget: 1200000 }, // Case 1: ~36tr/tháng (Pass Senior)
    { idBarber: 17, dailyTarget: 1200000 }, // Case 2: ~36tr/tháng
    { idBarber: 19, dailyTarget: 500000 },  // Case 3: ~15tr/tháng (Fail)
    { idBarber: 16, dailyTarget: 1800000 }, // Case 4: ~54tr/tháng (Pass Master)
  ];

  evaluateMonths.forEach((monthMoment) => {
    const daysInMonth = monthMoment.daysInMonth();
    const isCurrentMonth = monthMoment.isSame(moment(), 'month');
    
    // Nếu là tháng hiện tại, chỉ tạo dữ liệu đến ngày hôm nay
    const limitDay = isCurrentMonth ? moment().date() : daysInMonth;

    for (let day = 1; day <= limitDay; day++) {
      const currentDate = monthMoment.clone().date(day).format("YYYY-MM-DD");

      testScenarios.forEach((scenario) => {
        const idCustomer = customerIds[Math.floor(Math.random() * customerIds.length)];
        
        // Random phương thức thanh toán cho mỗi lần booking
        const getRandomMethod = () => (Math.random() > 0.4 ? "Transfer" : "Cash");

        // Booking sáng
        bookings.push({
          idCustomer,
          idBarber: scenario.idBarber,
          idCustomerVoucher: null,
          guestCount: 1,
          bookingDate: currentDate,
          bookingTime: "10:00",
          status: "Completed",
          description: "Khách test dữ liệu hệ thống",
          total: scenario.dailyTarget / 2,
          isPaid: true,
          paymentMethod: getRandomMethod(), // Bổ sung paymentMethod
          createdAt: new Date(`${currentDate}T10:00:00`),
          updatedAt: new Date(`${currentDate}T10:00:00`),
        });

        // Booking chiều
        bookings.push({
          idCustomer,
          idBarber: scenario.idBarber,
          idCustomerVoucher: null,
          guestCount: 1,
          bookingDate: currentDate,
          bookingTime: "16:30",
          status: "Completed",
          description: "Khách test dữ liệu hệ thống",
          total: scenario.dailyTarget / 2,
          isPaid: true,
          paymentMethod: getRandomMethod(), // Bổ sung paymentMethod
          createdAt: new Date(`${currentDate}T16:30:00`),
          updatedAt: new Date(`${currentDate}T16:30:00`),
        });
      });
    }
  });

  // Chia nhỏ mảng để insert nếu dữ liệu quá lớn (Bulk insert tối ưu)
  const chunkSize = 100;
  for (let i = 0; i < bookings.length; i += chunkSize) {
    const chunk = bookings.slice(i, i + chunkSize);
    await queryInterface.bulkInsert("bookings", chunk);
  }
}

export async function down(queryInterface, Sequelize) {
  // Xóa sạch dữ liệu mẫu để chạy lại
  await queryInterface.bulkDelete("bookings", null, {});
}