// seeders/YYYYMMDDHHMMSS-demo-branches.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("branches", [
    {
      idBranch: 1,
      name: "Chi nhánh Trung tâm",
      address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
      latitude: 10.771971, 
      longitude: 106.698845,
      openTime: "08:00:00",
      closeTime: "21:00:00",
      slotDuration: 60,
      status: "Active",
      suspendDate: null,
      resumeDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBranch: 2,
      name: "Chi nhánh Quận 3",
      address: "456 Đường Nguyễn Đình Chiểu, Quận 3, TP.HCM",
      latitude: 10.776100,
      longitude: 106.682100,
      openTime: "08:00:00",
      closeTime: "21:00:00",
      slotDuration: 60,
      status: "Active",
      suspendDate: null,
      resumeDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBranch: 3,
      name: "Chi nhánh Bình Thạnh",
      address: "789 Đường Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM",
      latitude: 10.812300,
      longitude: 106.711800,
      openTime: "08:00:00",
      closeTime: "21:00:00",
      slotDuration: 60,
      status: "Active",
      suspendDate: null,
      resumeDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("branches", null, {});
}