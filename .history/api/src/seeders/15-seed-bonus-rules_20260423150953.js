"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("bonus_rules", [
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("bonus_rules", null, {});
}
