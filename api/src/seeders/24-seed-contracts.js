"use strict";
import moment from "moment";

export async function up(queryInterface) {
  // Dùng moment để sinh ngày động
  const today = moment().format("YYYY-MM-DD");
  
  // Các mốc thời gian
  const nextMonth = moment().add(1, "months").format("YYYY-MM-DD");
  const nextMonthEnd = moment(nextMonth).add(1, "years").format("YYYY-MM-DD"); // Hết hạn sau 1 năm
  
  const lastMonth = moment().subtract(1, "months").format("YYYY-MM-DD");
  const lastMonthEnd = moment(lastMonth).add(1, "years").format("YYYY-MM-DD"); // Hết hạn sau 1 năm
  
  const lastYear = moment().subtract(1, "years").format("YYYY-MM-DD");
  const lastYearEnd = moment(lastYear).add(1, "years").subtract(1, "days").format("YYYY-MM-DD"); // Vừa hết hạn năm ngoái

  await queryInterface.bulkInsert(
    "salary_contracts",
    [
      // ════════════════════════════════════════════════════════════════════
      // 1. CÁC CA ĐANG HIỆU LỰC (Đã chạy và chưa tới ngày hết hạn)
      // ════════════════════════════════════════════════════════════════════
      {
        idContract: 1, idBarber: 15, idPlan: 2, actualBaseSalary: 5000000.00,
        startDate: lastMonth,     // Bắt đầu tháng trước
        endDate: lastMonthEnd,    // Kết thúc vào năm sau (Đã FIX BẮT BUỘC CÓ END DATE)
        status: "active", createdAt: new Date(), updatedAt: new Date(),
      },
      {
        idContract: 2, idBarber: 16, idPlan: 2, actualBaseSalary: 4500000.00,
        startDate: "2025-10-01",  
        endDate: "2026-10-01",    // Giả sử có kỳ hạn 1 năm
        status: "active", createdAt: new Date(), updatedAt: new Date(),
      },
      { // Ca thử việc 2 tháng
        idContract: 3, idBarber: 17, idPlan: 1, actualBaseSalary: 3000000.00,
        startDate: lastMonth,
        endDate: moment().add(1, "months").format("YYYY-MM-DD"), // Thử việc kết thúc tháng sau
        status: "active", createdAt: new Date(), updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // 2. CA ĐÃ HẾT HẠN / LỊCH SỬ LÊN CẤP (Để test tái ký)
      // ════════════════════════════════════════════════════════════════════
      {
        idContract: 4, idBarber: 18, idPlan: 3, actualBaseSalary: 7000000.00,
        startDate: lastYear,      // Ký từ năm ngoái
        endDate: lastYearEnd,     // Vừa hết hạn hôm qua
        status: "closed",         // Trạng thái đã đóng vì hết hạn
        createdAt: new Date(), updatedAt: new Date(),
      },
      { // Hợp đồng mới của thợ 18 sau khi tái ký
        idContract: 5, idBarber: 18, idPlan: 3, actualBaseSalary: 7500000.00, // Tăng lương
        startDate: today,
        endDate: moment(today).add(1, "years").format("YYYY-MM-DD"),
        status: "active", createdAt: new Date(), updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // 3. CA CHỜ HIỆU LỰC (Được phép Sửa)
      // ════════════════════════════════════════════════════════════════════
      {
        idContract: 7, idBarber: 21, idPlan: 1, actualBaseSalary: 3000000.00,
        startDate: nextMonth,     // Tháng sau mới bắt đầu đi làm
        endDate: nextMonthEnd,    // Kỳ hạn 1 năm
        status: "active", 
        createdAt: new Date(), updatedAt: new Date(),
      },
    ],
    { ignoreDuplicates: true },
  );
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("salary_contracts", null, {});
}