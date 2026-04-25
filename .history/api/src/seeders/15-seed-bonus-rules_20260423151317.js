"use strict";

export async function up(queryInterface, Sequelize) {
  // không làm gì cả
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("bonus_rules", null, {});
}
