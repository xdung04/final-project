"use strict";

// ── Phụ thuộc: barbers + compensation_plans phải được seed trước ─────────────
//
// Mapping barber → plan (dựa trên kinh nghiệm & specialty từ barber seeder):
//
//   idBarber | experienceYears | Plan
//   ─────────────────────────────────────────────────────────────────────────
//   15       | 6 năm           | Senior  (idPlan: 2) — fade/undercut expert
//   16       | 5 năm           | Senior  (idPlan: 2) — nhuộm/uốn specialist
//   17       | 4 năm           | Junior  (idPlan: 1) — cắt cơ bản, mới vào
//   18       | 7 năm           | Master  (idPlan: 3) — Master Barber cert
//   19       | 5 năm           | Senior  (idPlan: 2) — color specialist
//   20       | 6 năm           | Senior  (idPlan: 2) — styling/uốn duỗi
//   21       | 4 năm           | Junior  (idPlan: 1) — barber trẻ, năng động
//   22       | 5 năm           | Senior  (idPlan: 2) — tóc nữ/layer
//   23       | 7 năm           | Master  (idPlan: 3) — classic/beard master
// ─────────────────────────────────────────────────────────────────────────────

export async function up(queryInterface) {
  await queryInterface.bulkInsert(
    "salary_contracts",
    [
      // ════════════════════════════════════════════════════════════════════
      // BRANCH 1 — idBarber: 15, 16, 17
      // ════════════════════════════════════════════════════════════════════

      // Barber 15 — 6 năm, Fade/Undercut expert → Senior
      // Lương custom (deal riêng): 5.000.000 thay vì mặc định 4.500.000
      {
        idContract: 1,
        idBarber: 15,
        idPlan: 2,
        actualBaseSalary: 5000000.00,   // Custom deal
        contractType: "full_time",
        startDate: "2024-06-01",
        endDate: null,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Barber 16 — 5 năm, Nhuộm/Uốn specialist → Senior
      // Lương theo mặc định
      {
        idContract: 2,
        idBarber: 16,
        idPlan: 2,
        actualBaseSalary: 4500000.00,   // Default Senior
        contractType: "full_time",
        startDate: "2024-09-01",
        endDate: null,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Barber 17 — 4 năm, Cơ bản → Junior (thử việc 2 tháng)
      {
        idContract: 3,
        idBarber: 17,
        idPlan: 1,
        actualBaseSalary: 3000000.00,   // Default Junior
        contractType: "probation",
        startDate: "2025-03-01",
        endDate: "2025-04-30",          // Thử việc 2 tháng
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // BRANCH 2 — idBarber: 18, 19, 20
      // ════════════════════════════════════════════════════════════════════

      // Barber 18 — 7 năm, Master Barber cert → Master
      // Lương custom cao nhất: 7.000.000
      {
        idContract: 4,
        idBarber: 18,
        idPlan: 3,
        actualBaseSalary: 7000000.00,   // Custom deal — trưởng nhóm chi nhánh 2
        contractType: "full_time",
        startDate: "2023-01-15",
        endDate: null,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Barber 19 — 5 năm, Color specialist → Senior
      {
        idContract: 5,
        idBarber: 19,
        idPlan: 2,
        actualBaseSalary: 4500000.00,   // Default Senior
        contractType: "full_time",
        startDate: "2024-03-01",
        endDate: null,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Barber 20 — 6 năm, Styling/Uốn Duỗi → Senior
      // Lương custom do có thâm niên
      {
        idContract: 6,
        idBarber: 20,
        idPlan: 2,
        actualBaseSalary: 4800000.00,   // Custom deal
        contractType: "full_time",
        startDate: "2023-08-01",
        endDate: null,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ════════════════════════════════════════════════════════════════════
      // BRANCH 3 — idBarber: 21, 22, 23
      // ════════════════════════════════════════════════════════════════════

      // Barber 21 — 4 năm, Modern Cut → Junior
      {
        idContract: 7,
        idBarber: 21,
        idPlan: 1,
        actualBaseSalary: 3000000.00,   // Default Junior
        contractType: "full_time",
        startDate: "2024-11-01",
        endDate: null,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Barber 22 — 5 năm, Tóc nữ/Layer → Senior
      {
        idContract: 8,
        idBarber: 22,
        idPlan: 2,
        actualBaseSalary: 4500000.00,   // Default Senior
        contractType: "full_time",
        startDate: "2024-05-15",
        endDate: null,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Barber 23 — 7 năm, Classic/Beard Master → Master
      // Master Barber 2023 cert → lương cao
      {
        idContract: 9,
        idBarber: 23,
        idPlan: 3,
        actualBaseSalary: 6500000.00,   // Custom deal
        contractType: "full_time",
        startDate: "2023-05-10",
        endDate: null,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
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