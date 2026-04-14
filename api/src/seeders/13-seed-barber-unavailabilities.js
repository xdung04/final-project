"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("barber_unavailabilities", [
    {
      idBarber: 15,
      startDate: "2025-03-10",
      endDate: "2025-03-12",
      reason: "Nghỉ phép cá nhân",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 17,
      startDate: "2025-05-01",
      endDate: "2025-05-03",
      reason: "Nghỉ lễ 30/4",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 18,
      startDate: "2025-06-15",
      endDate: "2025-06-15",
      reason: "Nghỉ ốm",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 20,
      startDate: "2025-08-20",
      endDate: "2025-08-22",
      reason: "Đi công tác",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 22,
      startDate: "2025-10-10",
      endDate: "2025-10-10",
      reason: "Việc gia đình",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("barber_unavailabilities", null, {});
}
