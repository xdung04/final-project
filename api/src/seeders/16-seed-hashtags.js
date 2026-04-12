"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("hashtags", [
    { name: "Fade", createdAt: new Date(), updatedAt: new Date() },
    { name: "BarberStyle", createdAt: new Date(), updatedAt: new Date() },
    { name: "LayerCut", createdAt: new Date(), updatedAt: new Date() },
    { name: "StylePro", createdAt: new Date(), updatedAt: new Date() },
    { name: "KidHaircut", createdAt: new Date(), updatedAt: new Date() },
    { name: "FunBarber", createdAt: new Date(), updatedAt: new Date() },
    { name: "BeardTrim", createdAt: new Date(), updatedAt: new Date() },
    { name: "ClassicMen", createdAt: new Date(), updatedAt: new Date() },
    { name: "Highlight", createdAt: new Date(), updatedAt: new Date() },
    { name: "WavyHair", createdAt: new Date(), updatedAt: new Date() },
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("hashtags", null, {});
}
