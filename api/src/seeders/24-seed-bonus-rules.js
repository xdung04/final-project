"use strict";

export async function up(queryInterface) {
  await queryInterface.bulkInsert("bonus_rules", [
    // Junior: 80 khách + rating 4.5 → +500k
    { idBonus: 1, idPlan: 1, bonusName: "Thưởng chất lượng Junior",
      minCustomerCount: 80, minAverageRating: 4.50, rewardAmount: 500000,
      evaluationPeriodMonths: 1, createdAt: new Date(), updatedAt: new Date() },
      
    // Senior: 120 khách + rating 4.7 → +1tr
    { idBonus: 2, idPlan: 2, bonusName: "Thưởng chất lượng Senior",
      minCustomerCount: 120, minAverageRating: 4.70, rewardAmount: 1000000,
      evaluationPeriodMonths: 1, createdAt: new Date(), updatedAt: new Date() },
      
    // Senior: vượt chỉ tiêu — 150 khách + rating 4.8 → +500k thêm
    { idBonus: 3, idPlan: 2, bonusName: "Thưởng vượt chỉ tiêu Senior",
      minCustomerCount: 150, minAverageRating: 4.80, rewardAmount: 500000,
      evaluationPeriodMonths: 1, createdAt: new Date(), updatedAt: new Date() },
      
    // Master: 160 khách + rating 4.8 → +1.5tr
    { idBonus: 4, idPlan: 3, bonusName: "Thưởng Master Elite",
      minCustomerCount: 160, minAverageRating: 4.80, rewardAmount: 1500000,
      evaluationPeriodMonths: 1, createdAt: new Date(), updatedAt: new Date() },
      
    // Master: xuất sắc — 180 khách + rating 4.9 → +1tr thêm
    { idBonus: 5, idPlan: 3, bonusName: "Thưởng Master xuất sắc",
      minCustomerCount: 180, minAverageRating: 4.90, rewardAmount: 1000000,
      evaluationPeriodMonths: 1, createdAt: new Date(), updatedAt: new Date() },
  ], {});
}

export async function down(queryInterface) {
  // Clear sạch bảng và reset hoàn toàn Auto-Increment về 1
  await queryInterface.sequelize.query("TRUNCATE TABLE bonus_rules RESTART IDENTITY CASCADE;");
}