"use strict";
import moment from "moment";

export async function up(queryInterface) {
  const today       = moment().format("YYYY-MM-DD");
  const tomorrow    = moment().add(1,  "days").format("YYYY-MM-DD");
  const nextMonth   = moment().add(1,  "months").format("YYYY-MM-DD");
  const lastMonth   = moment().subtract(1, "months").format("YYYY-MM-DD");
  const lastYear    = moment().subtract(1, "years").format("YYYY-MM-DD");
  const yesterday   = moment().subtract(1, "days").format("YYYY-MM-DD");

  await queryInterface.bulkInsert(
    "salary_contracts",
    [
      // ════════════════════════════════════════════════════════════════════
      // NHÓM A — ĐANG HIỆU LỰC (isActive = true trong frontend)
      // Điều kiện: startDate <= today VÀ (endDate NULL hoặc endDate >= today)
      // ════════════════════════════════════════════════════════════════════

      // A1: Junior — active, vô thời hạn (endDate null)
      {
        idContract: 1, idBarber: 15, idPlan: 1,
        actualBaseSalary: 3000000.00,
        startDate: lastMonth,
        endDate: null,           // Vô thời hạn
        status: "active",
        createdAt: new Date(), updatedAt: new Date(),
      },

      // A2: Senior — active, còn hạn
      {
        idContract: 2, idBarber: 16, idPlan: 2,
        actualBaseSalary: 4500000.00,
        startDate: lastMonth,
        endDate: moment().add(1, "years").format("YYYY-MM-DD"),
        status: "active",
        createdAt: new Date(), updatedAt: new Date(),
      },

      // A3: Master — active, custom salary cao hơn default
      {
        idContract: 3, idBarber: 18, idPlan: 3,
        actualBaseSalary: 7500000.00,  // Custom cao hơn default 6tr
        startDate: today,
        endDate: moment(today).add(1, "years").format("YYYY-MM-DD"),
        status: "active",
        createdAt: new Date(), updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // NHÓM B — CHỜ HIỆU LỰC (isPending = true trong frontend)
      // Điều kiện: startDate > today
      // → Được phép Sửa, Hủy bỏ; KHÔNG được Chấm dứt
      // ════════════════════════════════════════════════════════════════════

      // B1: Hợp đồng nháp — bắt đầu tháng sau
      {
        idContract: 4, idBarber: 21, idPlan: 1,
        actualBaseSalary: 3000000.00,
        startDate: nextMonth,
        endDate: moment(nextMonth).add(1, "years").format("YYYY-MM-DD"),
        status: "active",
        createdAt: new Date(), updatedAt: new Date(),
      },

      // B2: Hợp đồng nháp — bắt đầu ngày mai (edge case sát ngày)
      {
        idContract: 5, idBarber: 22, idPlan: 2,
        actualBaseSalary: 4500000.00,
        startDate: tomorrow,
        endDate: moment(tomorrow).add(6, "months").format("YYYY-MM-DD"),
        status: "active",
        createdAt: new Date(), updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // NHÓM C — ĐÃ HẾT HẠN (isExpired = true trong frontend)
      // Điều kiện: endDate < today
      // → Chỉ được Ký HĐ mới; không Sửa, không Chấm dứt
      // ════════════════════════════════════════════════════════════════════

      // C1: Hợp đồng hết hạn hôm qua (edge case)
      {
        idContract: 6, idBarber: 23, idPlan: 2,
        actualBaseSalary: 4500000.00,
        startDate: lastYear,
        endDate: yesterday,       // Hết hạn hôm qua
        status: "active",         // status vẫn active nhưng frontend sẽ tính isExpired
        createdAt: new Date(), updatedAt: new Date(),
      },

      // C2: Hợp đồng hết hạn lâu (đã closed)
      {
        idContract: 7, idBarber: 24, idPlan: 1,
        actualBaseSalary: 3000000.00,
        startDate: lastYear,
        endDate: moment(lastYear).add(6, "months").format("YYYY-MM-DD"),
        status: "closed",
        createdAt: new Date(), updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // NHÓM D — LỊCH SỬ LÊN CẤP (để test audit trail)
      // ════════════════════════════════════════════════════════════════════

      // D1: Hợp đồng cũ của barber 18 (trước khi lên Master)
      {
        idContract: 8, idBarber: 18, idPlan: 2,
        actualBaseSalary: 4500000.00,
        startDate: lastYear,
        endDate: yesterday,
        status: "closed",         // Đóng khi ký mới (idContract: 3)
        createdAt: new Date(), updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // NHÓM E — BỊ CHẤM DỨT (terminated)
      // ════════════════════════════════════════════════════════════════════

      // E1: Hợp đồng bị chấm dứt sớm
      {
        idContract: 9, idBarber: 25, idPlan: 1,
        actualBaseSalary: 3000000.00,
        startDate: lastMonth,
        endDate: yesterday,       // Chấm dứt hôm qua
        status: "terminated",
        createdAt: new Date(), updatedAt: new Date(),
      },
    ],
    { ignoreDuplicates: true },
  );
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("salary_contracts", {
    idContract: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  });
}