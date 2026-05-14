"use strict";

export async function up(queryInterface) {
  await queryInterface.bulkInsert("salary_contracts", [
    // B15: Junior - Làm từ 08/2025 (Đủ > 6 tháng để lên Senior)
    { idContract: 1, idBarber: 15, idPlan: 1, actualBaseSalary: 3000000, startDate: "2025-08-01", status: "active", createdAt: new Date(), updatedAt: new Date() },

    // B16: Senior - Làm từ 01/2025 (Đủ > 12 tháng để lên Master)
    { idContract: 4, idBarber: 16, idPlan: 2, actualBaseSalary: 4500000, startDate: "2025-01-01", status: "active", createdAt: new Date(), updatedAt: new Date() },

    // B17: Junior - Mới làm từ 01/2026 (Chỉ mới 3 tháng, fail thâm niên 6 tháng)
    { idContract: 2, idBarber: 17, idPlan: 1, actualBaseSalary: 3000000, startDate: "2026-01-01", status: "active", createdAt: new Date(), updatedAt: new Date() },

    // B19: Junior - Làm lâu nhưng doanh thu thấp (sẽ fail ở bảng lương)
    { idContract: 3, idBarber: 19, idPlan: 1, actualBaseSalary: 3000000, startDate: "2025-08-01", status: "active", createdAt: new Date(), updatedAt: new Date() },
  ], { ignoreDuplicates: true });
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("salary_contracts", null, {});
}