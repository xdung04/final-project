"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("receptionists", [
    // idReceptionist = idUser của receptionist
    { idReceptionist: 12, idBranch: 1, createdAt: new Date(), updatedAt: new Date() },
    { idReceptionist: 13, idBranch: 2, createdAt: new Date(), updatedAt: new Date() },
    { idReceptionist: 14, idBranch: 3, createdAt: new Date(), updatedAt: new Date() },
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("receptionists", null, {});
}
