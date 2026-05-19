// 03-receptionistsSeeder.js
"use strict";

export async function up(queryInterface) {
  const now = new Date();

   await queryInterface.bulkInsert("receptionists", [
    { idReceptionist: 32, idBranch: 1, createdAt: new Date("2024-12-15"), updatedAt: new Date("2024-12-15") },
    { idReceptionist: 33, idBranch: 2, createdAt: new Date("2024-12-15"), updatedAt: new Date("2024-12-15") },
    { idReceptionist: 34, idBranch: 3, createdAt: new Date("2024-12-15"), updatedAt: new Date("2024-12-15") },
    { idReceptionist: 35, idBranch: 4, createdAt: new Date("2025-01-15"), updatedAt: new Date("2025-01-15") },
  ], { ignoreDuplicates: true });
}
export async function down(queryInterface) {
  await queryInterface.bulkDelete("receptionists", null, {});
}