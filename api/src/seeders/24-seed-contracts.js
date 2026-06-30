"use strict";

// ════════════════════════════════════════════════════════════════════════════
// FILE 06 — salary_contracts (ĐÃ SỬA LỖI TRÙNG ID)
// ════════════════════════════════════════════════════════════════════════════

// Đã bỏ tham số id ở đầu, để database tự động TĂNG TIẾN chuẩn chỉnh
const makeContract = (barber, plan, base, start, end = null, status = "active", reason = null) => ({
  idBarber: barber, 
  idPlan: plan, 
  actualBaseSalary: base,
  startDate: start, 
  endDate: end, 
  status, 
  terminationReason: reason,
  createdAt: new Date(), 
  updatedAt: new Date(),
});

export async function up(queryInterface) {
  await queryInterface.bulkInsert("salary_contracts", [

    // ════════════════════════════════════════════════════════════════════
    // BRANCH 1 (idBarber 36–45)
    // ════════════════════════════════════════════════════════════════════

    // B36 — Master
    makeContract(36, 4, 2500000, "2024-06-01", "2024-12-31", "closed"),
    makeContract(36, 2, 4500000, "2025-01-01", "2025-06-30", "closed"),
    makeContract(36, 3, 6000000, "2025-07-01"),

    // B37 — Senior
    makeContract(37, 1, 3000000, "2024-08-01", "2025-06-30", "closed"),
    makeContract(37, 2, 4500000, "2025-07-01"),

    // B38 — Senior
    makeContract(38, 1, 3000000, "2024-10-01", "2025-09-30", "closed"),
    makeContract(38, 2, 4500000, "2025-10-01"),

    // B39-B42 — Junior active
    makeContract(39, 1, 3000000, "2025-01-01"),
    makeContract(40, 1, 3000000, "2025-01-01"),
    makeContract(41, 1, 3000000, "2025-02-01"),
    makeContract(42, 1, 3000000, "2025-03-01"),

    // B43 — Junior doanh thu thấp
    makeContract(43, 1, 3000000, "2025-01-01"),

    // B44 — Junior chưa đủ tháng
    makeContract(44, 1, 3000000, "2025-10-01"),

    // B45 — Junior mới nhất
    makeContract(45, 1, 3000000, "2026-01-01"),

    // ════════════════════════════════════════════════════════════════════
    // BRANCH 2 (idBarber 46–55)
    // ════════════════════════════════════════════════════════════════════

    // B46 — Master
    makeContract(46, 4, 2500000, "2024-06-01", "2024-12-31", "closed"),
    makeContract(46, 2, 4500000, "2025-01-01", "2025-06-30", "closed"),
    makeContract(46, 3, 6000000, "2025-07-01"),

    // B47 — Senior
    makeContract(47, 1, 3000000, "2024-08-01", "2025-06-30", "closed"),
    makeContract(47, 2, 4500000, "2025-07-01"),

    // B48 — Senior
    makeContract(48, 1, 3000000, "2024-10-01", "2025-09-30", "closed"),
    makeContract(48, 2, 4500000, "2025-10-01"),

    // B49-B52 — Junior active
    makeContract(49, 1, 3000000, "2025-01-01"),
    makeContract(50, 1, 3000000, "2025-01-01"),
    makeContract(51, 1, 3000000, "2025-02-01"),
    makeContract(52, 1, 3000000, "2025-03-01"),

    // B53 — Junior doanh thu thấp
    makeContract(53, 1, 3000000, "2025-01-01"),

    // B54 — Junior chưa đủ tháng
    makeContract(54, 1, 3000000, "2025-10-01"),

    // B55 — Junior mới nhất
    makeContract(55, 1, 3000000, "2026-01-01"),

    // ════════════════════════════════════════════════════════════════════
    // BRANCH 3 (idBarber 56–65)
    // ════════════════════════════════════════════════════════════════════

    // B56 — Master
    makeContract(56, 4, 2500000, "2024-06-01", "2024-12-31", "closed"),
    makeContract(56, 2, 4500000, "2025-01-01", "2025-06-30", "closed"),
    makeContract(56, 3, 6000000, "2025-07-01"),

    // B57 — Senior
    makeContract(57, 1, 3000000, "2024-08-01", "2025-06-30", "closed"),
    makeContract(57, 2, 4500000, "2025-07-01"),

    // B58 — Senior
    makeContract(58, 1, 3000000, "2024-10-01", "2025-09-30", "closed"),
    makeContract(58, 2, 4500000, "2025-10-01"),

    // B59-B62 — Junior active
    makeContract(59, 1, 3000000, "2025-01-01"),
    makeContract(60, 1, 3000000, "2025-01-01"),
    makeContract(61, 1, 3000000, "2025-02-01"),
    makeContract(62, 1, 3000000, "2025-03-01"),

    // B63 — Junior doanh thu thấp
    makeContract(63, 1, 3000000, "2025-01-01"),

    // B64 — Junior chưa đủ tháng
    makeContract(64, 1, 3000000, "2025-10-01"),

    // B65 — Junior mới nhất
    makeContract(65, 1, 3000000, "2026-01-01"),

    // ════════════════════════════════════════════════════════════════════
    // BRANCH 4 — Thủ Đức (idBarber 66–75)
    // ════════════════════════════════════════════════════════════════════

    // B66 — Senior
    makeContract(66, 1, 3000000, "2025-01-15", "2025-09-30", "closed"),
    makeContract(66, 2, 4500000, "2025-10-01"),

    // B67-B72 — Junior
    makeContract(67, 1, 3000000, "2025-01-15"),
    makeContract(68, 1, 3000000, "2025-02-01"),
    makeContract(69, 1, 3000000, "2025-02-01"),
    makeContract(70, 1, 3000000, "2025-03-01"),
    makeContract(71, 1, 3000000, "2025-03-01"),
    makeContract(72, 1, 3000000, "2025-04-01"),

    // B73 — Junior doanh thu thấp
    makeContract(73, 1, 3000000, "2025-01-15"),

    // B74 — Junior chưa đủ tháng
    makeContract(74, 1, 3000000, "2025-10-01"),

    // B75 — Junior mới nhất
    makeContract(75, 1, 3000000, "2025-05-01"),

  ], {}); // Đã bỏ ignoreDuplicates để thông báo lỗi rõ ràng nếu có bất đối xứng dữ liệu
}

export async function down(queryInterface) {
  // Sử dụng TRUNCATE kết hợp RESTART IDENTITY (nếu dùng Postgres) hoặc RESTART để xóa sạch sẽ và reset Auto-Increment về 1
  await queryInterface.sequelize.query("TRUNCATE TABLE salary_contracts RESTART IDENTITY CASCADE;");
}