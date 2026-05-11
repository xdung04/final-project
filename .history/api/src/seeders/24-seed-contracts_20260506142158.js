"use strict";
import moment from "moment";

export async function up(queryInterface) {
  // Đảm bảo lấy đúng mùng 1 theo chuẩn V9.0
  const startOfLastMonth = moment().subtract(1, "months").startOf("month").format("YYYY-MM-DD");
  const endOfLastMonth   = moment().subtract(1, "months").endOf("month").format("YYYY-MM-DD");
  
  const startOfThisMonth = moment().startOf("month").format("YYYY-MM-DD");
  const endOfThisMonth   = moment().endOf("month").format("YYYY-MM-DD");
  
  const startOfNextMonth = moment().add(1, "months").startOf("month").format("YYYY-MM-DD");
  const yesterday        = moment().subtract(1, "days").format("YYYY-MM-DD");

  await queryInterface.bulkInsert(
    "salary_contracts",
    [
      // ════════════════════════════════════════════════════════════════════
      // NHÓM 1: ĐANG HOẠT ĐỘNG (ACTIVE) - KHÔNG CÓ NGÀY NGHỈ
      // ════════════════════════════════════════════════════════════════════
      
      // Barber 15: Junior bình thường, làm từ tháng trước
      {
        idContract: 1, idBarber: 15, idPlan: 1,
        actualBaseSalary: 3000000.00,
        startDate: startOfLastMonth,
        endDate: null,
        status: "active",
        createdAt: new Date(), updatedAt: new Date(),
      },

      // Barber 18: Master mới (vừa lên cấp từ mùng 1 tháng này)
      {
        idContract: 3, idBarber: 18, idPlan: 3,
        actualBaseSalary: 7500000.00,
        startDate: startOfThisMonth,
        endDate: null,
        status: "active",
        createdAt: new Date(), updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // NHÓM 2: ĐANG HOẠT ĐỘNG (ACTIVE) - ĐÃ SET NGÀY NGHỈ (Chờ Quyết Toán)
      // ════════════════════════════════════════════════════════════════════
      
      // Barber 16: Senior, dự kiến nghỉ vào cuối tháng này
      // Test: Nút "Quyết toán & Chấm dứt" và "Hủy ngày nghỉ"
      {
        idContract: 2, idBarber: 16, idPlan: 2,
        actualBaseSalary: 4500000.00,
        startDate: startOfLastMonth,
        endDate: endOfThisMonth, 
        status: "active",
        createdAt: new Date(), updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // NHÓM 3: CHỜ HIỆU LỰC (PENDING) - BẮT BUỘC MÙNG 1 THÁNG SAU
      // ════════════════════════════════════════════════════════════════════
      
      // Barber 21: Thợ mới, bắt đầu từ tháng sau
      // Test: Nút "Sửa" (đổi lương/plan), "Hủy bỏ"
      {
        idContract: 4, idBarber: 21, idPlan: 1,
        actualBaseSalary: 3000000.00,
        startDate: startOfNextMonth,
        endDate: null,
        status: "active",
        createdAt: new Date(), updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // NHÓM 4: ĐÃ ĐÓNG (CLOSED) - LỊCH SỬ LÊN CẤP
      // ════════════════════════════════════════════════════════════════════
      
      // HĐ cũ của Barber 18: Senior (đã đóng để lên Master ở HĐ id: 3)
      // Test: Hiển thị lịch sử, không cho thao tác
      {
        idContract: 8, idBarber: 18, idPlan: 2,
        actualBaseSalary: 4500000.00,
        startDate: startOfLastMonth,
        endDate: endOfLastMonth,
        closedAt: endOfLastMonth, // Field mới V9.0
        status: "closed",
        createdAt: new Date(), updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // NHÓM 5: CHẤM DỨT (TERMINATED) - ĐÃ NGHỈ VIỆC
      // ════════════════════════════════════════════════════════════════════
      
      // Barber 25: Nghỉ việc hôm qua
      // Test: Hiển thị lý do, Barber phải bị isLocked
      {
        idContract: 9, idBarber: 25, idPlan: 1,
        actualBaseSalary: 3000000.00,
        startDate: startOfLastMonth,
        endDate: yesterday,
        terminationReason: "Bỏ việc không báo trước, vi phạm nội quy", // Field mới V9.0
        status: "terminated",
        createdAt: new Date(), updatedAt: new Date(),
      },
    ],
    { ignoreDuplicates: true },
  );
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("salary_contracts", null, {});
}