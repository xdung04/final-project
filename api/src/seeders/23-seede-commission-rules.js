"use strict";

export async function up(queryInterface) {
  await queryInterface.bulkInsert("commission_rules", [
    // Junior: 8% | 10% | 12%
    { idRule: 1, idPlan: 1, minRevenueStep:        0, maxRevenueStep: 20000000, commissionRate:  8.00, priority: 1, createdAt: new Date(), updatedAt: new Date() },
    { idRule: 2, idPlan: 1, minRevenueStep: 20000000, maxRevenueStep: 40000000, commissionRate: 10.00, priority: 2, createdAt: new Date(), updatedAt: new Date() },
    { idRule: 3, idPlan: 1, minRevenueStep: 40000000, maxRevenueStep:     null, commissionRate: 12.00, priority: 3, createdAt: new Date(), updatedAt: new Date() },
    
    // Senior: 10% | 12% | 14%
    { idRule: 4, idPlan: 2, minRevenueStep:        0, maxRevenueStep: 20000000, commissionRate: 10.00, priority: 1, createdAt: new Date(), updatedAt: new Date() },
    { idRule: 5, idPlan: 2, minRevenueStep: 20000000, maxRevenueStep: 40000000, commissionRate: 12.00, priority: 2, createdAt: new Date(), updatedAt: new Date() },
    { idRule: 6, idPlan: 2, minRevenueStep: 40000000, maxRevenueStep:     null, commissionRate: 14.00, priority: 3, createdAt: new Date(), updatedAt: new Date() },
    
    // Master: 12% | 15% | 18%
    { idRule: 7, idPlan: 3, minRevenueStep:        0, maxRevenueStep: 20000000, commissionRate: 12.00, priority: 1, createdAt: new Date(), updatedAt: new Date() },
    { idRule: 8, idPlan: 3, minRevenueStep: 20000000, maxRevenueStep: 40000000, commissionRate: 15.00, priority: 2, createdAt: new Date(), updatedAt: new Date() },
    { idRule: 9, idPlan: 3, minRevenueStep: 40000000, maxRevenueStep:     null, commissionRate: 18.00, priority: 3, createdAt: new Date(), updatedAt: new Date() },
    
    // Junior 2024 (plan cũ): 7% | 9% | 11%
    { idRule: 10, idPlan: 4, minRevenueStep:        0, maxRevenueStep: 20000000, commissionRate:  7.00, priority: 1, createdAt: new Date(), updatedAt: new Date() },
    { idRule: 11, idPlan: 4, minRevenueStep: 20000000, maxRevenueStep: 40000000, commissionRate:  9.00, priority: 2, createdAt: new Date(), updatedAt: new Date() },
    { idRule: 12, idPlan: 4, minRevenueStep: 40000000, maxRevenueStep:     null, commissionRate: 11.00, priority: 3, createdAt: new Date(), updatedAt: new Date() },
  ], {}); // Bỏ ignoreDuplicates để kiểm soát dữ liệu chặt chẽ
}

export async function down(queryInterface) {
  // Clear sạch bảng và reset hoàn toàn Auto-Increment về 1 (Sửa lỗi thiếu ID 10, 11, 12 ở bản cũ)
  await queryInterface.sequelize.query("TRUNCATE TABLE commission_rules RESTART IDENTITY CASCADE;");
}