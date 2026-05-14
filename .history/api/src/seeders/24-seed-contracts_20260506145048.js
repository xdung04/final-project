"use strict";
import moment from "moment";

export async function up(queryInterface) {
  // --- MỐC THỜI GIAN TEST LÊN CẤP ---
  // Để lên Master: Cần 12 tháng thâm niên
  const fourteenMonthsAgo = moment().subtract(14, "months").startOf("month").format("YYYY-MM-DD");
  // Để lên Senior: Cần 6 tháng thâm niên
  const eightMonthsAgo    = moment().subtract(8, "months").startOf("month").format("YYYY-MM-DD");
  // Thiếu thâm niên: Chỉ mới làm 4 tháng
  const fourMonthsAgo     = moment().subtract(4, "months").startOf("month").format("YYYY-MM-DD");
  
  const startOfNextMonth  = moment().add(1, "months").startOf("month").format("YYYY-MM-DD");

  await queryInterface.bulkInsert(
    "salary_contracts",
    [
      // 🟢 CASE 1: ĐỦ ĐIỀU KIỆN LÊN SENIOR
      // Barber 15 (Junior): Làm 8 tháng (Pass thâm niên) + Doanh thu sẽ được seed > 30tr/tháng
      {
        idContract: 1, idBarber: 15, idPlan: 1,
        actualBaseSalary: 3000000.00,
        startDate: eightMonthsAgo, endDate: null, status: "active",
        createdAt: new Date(), updatedAt: new Date(),
      },

      // 🔴 CASE 2: TỊT NGÒI VÌ THIẾU THÂM NIÊN
      // Barber 17 (Junior): Doanh thu > 30tr/tháng nhưng mới làm 4 tháng (Fail thâm niên 6 tháng)
      {
        idContract: 2, idBarber: 17, idPlan: 1,
        actualBaseSalary: 3000000.00,
        startDate: fourMonthsAgo, endDate: null, status: "active",
        createdAt: new Date(), updatedAt: new Date(),
      },

      // 🔴 CASE 3: TỊT NGÒI VÌ THIẾU DOANH THU
      // Barber 19 (Junior): Làm 8 tháng (Pass thâm niên) nhưng Doanh thu lẹt đẹt < 20tr/tháng
      {
        idContract: 3, idBarber: 19, idPlan: 1,
        actualBaseSalary: 3000000.00,
        startDate: eightMonthsAgo, endDate: null, status: "active",
        createdAt: new Date(), updatedAt: new Date(),
      },

      // 👑 CASE 4: ĐỦ ĐIỀU KIỆN LÊN MASTER
      // Barber 16 (Senior): Làm 14 tháng (Pass thâm niên 12 tháng) + Doanh thu > 50tr/tháng
      {
        idContract: 4, idBarber: 16, idPlan: 2,
        actualBaseSalary: 4500000.00,
        startDate: fourteenMonthsAgo, endDate: null, status: "active",
        createdAt: new Date(), updatedAt: new Date(),
      },

      // --- CÁC TRƯỜNG HỢP UI KHÁC ---
      {
        idContract: 5, idBarber: 21, idPlan: 1, // Chờ hiệu lực
        actualBaseSalary: 3000000.00,
        startDate: startOfNextMonth, endDate: null, status: "active",
        createdAt: new Date(), updatedAt: new Date(),
      }
    ],
    { ignoreDuplicates: true },
  );
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("salary_contracts", null, {});
}