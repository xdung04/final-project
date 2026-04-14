"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("branches", [
    {
      idBranch: 1,
      name: "Chi nhánh Trung tâm",
      address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
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
