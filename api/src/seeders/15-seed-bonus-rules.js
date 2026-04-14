"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("BonusRules", [
    {
      minRevenue: 0,
      bonusPercent: 0,
      note: "Chưa đạt mốc, chưa có thưởng",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      minRevenue: 3000000,
      bonusPercent: 1.0,
      note: "Đạt mốc cơ bản, thưởng 1%",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      minRevenue: 5000000,
      bonusPercent: 1.5,
      note: "Doanh thu khá, thưởng 1.5%",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      minRevenue: 10000000,
      bonusPercent: 2.0,
      note: "Doanh thu tốt, thưởng 2%",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      minRevenue: 15000000,
      bonusPercent: 3.0,
      note: "Doanh thu cao, thưởng 3%",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      minRevenue: 25000000,
      bonusPercent: 5.0,
      note: "Doanh thu xuất sắc, thưởng tối đa 5%",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("BonusRules", null, {});
}
