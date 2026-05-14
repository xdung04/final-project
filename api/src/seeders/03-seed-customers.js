"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("customers", [
    // Regular & Frequent
    { idCustomer: 2,  loyaltyPoint: 245, address: "12 Lê Lợi, Quận 1", createdAt: "2025-01-10", updatedAt: "2026-05-10" },
    { idCustomer: 3,  loyaltyPoint: 180, address: "45 Pasteur, Quận 3", createdAt: "2025-01-15", updatedAt: "2026-05-09" },
    { idCustomer: 4,  loyaltyPoint: 320, address: "67 Nguyễn Trãi, Quận 5", createdAt: "2025-01-08", updatedAt: "2026-05-10" },

    // Occasional
    { idCustomer: 5,  loyaltyPoint: 95,  address: "89 Võ Văn Kiệt, Quận 1", createdAt: "2025-02-20", updatedAt: "2026-04-10" },
    { idCustomer: 6,  loyaltyPoint: 140, address: "112 Trần Hưng Đạo, Quận 1", createdAt: "2025-03-05", updatedAt: "2026-03-28" },

    // New & Recent
    { idCustomer: 7,  loyaltyPoint: 35,  address: "25 Đinh Tiên Hoàng, Bình Thạnh", createdAt: "2026-04-01", updatedAt: "2026-05-08" },
    { idCustomer: 8,  loyaltyPoint: 45,  address: "78 Lý Thường Kiệt, Quận 10", createdAt: "2026-04-15", updatedAt: "2026-05-07" },

    // Inactive
    { idCustomer: 9,  loyaltyPoint: 210, address: "134 Cách Mạng Tháng 8, Quận 10", createdAt: "2025-02-10", updatedAt: "2026-02-05" },
    { idCustomer: 10, loyaltyPoint: 80,  address: "203 Võ Thị Sáu, Quận 3", createdAt: "2025-01-25", updatedAt: "2026-01-20" },

    // Walk-in
    { idCustomer: 11, loyaltyPoint: 0,   address: null, createdAt: "2026-04-20", updatedAt: "2026-05-05" },
    { idCustomer: 12, loyaltyPoint: 0,   address: null, createdAt: "2026-05-01", updatedAt: "2026-05-03" },
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("customers", null, {});
}