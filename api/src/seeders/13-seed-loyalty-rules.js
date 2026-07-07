"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("loyalty_rules", [
    {
      name: "Quy tắc mặc định", // Thêm name
      money_per_point: 10000,
      point_multiplier: 1.0,
      min_order_amount: 0,
      is_default: true,
      is_active: true,
      start_date: null, // Quy tắc mặc định nên để null ngày
      end_date: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Chiến dịch hè 2025", // Thêm name
      money_per_point: 5000,
      point_multiplier: 1.5,
      min_order_amount: 50000,
      is_default: false,
      is_active: true,
      start_date: new Date("2025-06-01"),
      end_date: new Date("2025-12-31"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Chiến dịch năm 2024", // Thêm name
      money_per_point: 20000,
      point_multiplier: 2.0,
      min_order_amount: 100000,
      is_default: false,
      is_active: false,
      start_date: new Date("2024-01-01"),
      end_date: new Date("2024-12-31"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("loyalty_rules", null, {});
}