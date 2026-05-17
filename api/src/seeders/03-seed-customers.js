"use strict";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export async function up(queryInterface, Sequelize) {
  const now = new Date();
  const customers = [];

  // 10 customers cũ (ID 2-11)
  const oldData = [
    { id: 2, loyaltyPoint: 245, address: "12 Lê Lợi, Quận 1", createdAt: "2025-01-10" },
    { id: 3, loyaltyPoint: 180, address: "45 Pasteur, Quận 3", createdAt: "2025-01-15" },
    { id: 4, loyaltyPoint: 320, address: "67 Nguyễn Trãi, Quận 5", createdAt: "2025-01-08" },
    { id: 5, loyaltyPoint: 95, address: "89 Võ Văn Kiệt, Quận 1", createdAt: "2025-02-20" },
    { id: 6, loyaltyPoint: 140, address: "112 Trần Hưng Đạo, Quận 1", createdAt: "2025-03-05" },
    { id: 7, loyaltyPoint: 35, address: "25 Đinh Tiên Hoàng, Bình Thạnh", createdAt: "2026-04-01" },
    { id: 8, loyaltyPoint: 45, address: "78 Lý Thường Kiệt, Quận 10", createdAt: "2026-04-15" },
    { id: 9, loyaltyPoint: 210, address: "134 Cách Mạng Tháng 8, Quận 10", createdAt: "2025-02-10" },
    { id: 10, loyaltyPoint: 80, address: "203 Võ Thị Sáu, Quận 3", createdAt: "2025-01-25" },
    { id: 11, loyaltyPoint: 0, address: null, createdAt: "2026-04-20" }
  ];
  for (const data of oldData) {
    customers.push({
      idCustomer: data.id,
      loyaltyPoint: data.loyaltyPoint,
      address: data.address,
      createdAt: data.createdAt,
      updatedAt: now,
    });
  }

  // Thêm 200 customers mới (ID 24-223)
  for (let id = 24; id <= 223; id++) {
    customers.push({
      idCustomer: id,
      loyaltyPoint: randomInt(0, 500),
      address: `Đường số ${randomInt(1, 50)}, Phường ${randomInt(1, 15)}, Quận ${randomInt(1, 12)}`,
      createdAt: randomDate(new Date(2025, 0, 1), new Date(2026, 4, 20)),
      updatedAt: now,
    });
  }

  await queryInterface.bulkInsert("customers", customers);
  console.log(`✅ Seeded ${customers.length} customers (10 old + 200 new)`);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("customers", null, {});
}