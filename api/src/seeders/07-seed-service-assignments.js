"use strict";

export async function up(queryInterface, Sequelize) {
  const branches = [1, 2, 3];
  const services = [1, 2, 3, 4, 5, 6, 7, 8];
  const assignments = [];

  branches.forEach((idBranch) => {
    services.forEach((idService) => {
      assignments.push({
        idBranch,
        idService,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  });

  await queryInterface.bulkInsert("service_assignments", assignments);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("service_assignments", null, {});
}
