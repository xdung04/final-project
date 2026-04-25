"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("BonusRules", [
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("BonusRules", null, {});
}
