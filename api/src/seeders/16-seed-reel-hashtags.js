"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("reel_hashtags", [
    // Reel 1 – Fade
    { idReel: 1, idHashtag: 1, createdAt: new Date() }, // Fade
    { idReel: 1, idHashtag: 2, createdAt: new Date() }, // BarberStyle

    // Reel 2 – Layer nữ
    { idReel: 2, idHashtag: 3, createdAt: new Date() }, // LayerCut
    { idReel: 2, idHashtag: 4, createdAt: new Date() }, // StylePro

    // Reel 3 – Râu
    { idReel: 3, idHashtag: 7, createdAt: new Date() }, // BeardTrim
    { idReel: 3, idHashtag: 8, createdAt: new Date() }, // ClassicMen

    // Reel 4 – Highlight
    { idReel: 4, idHashtag: 9, createdAt: new Date() }, // Highlight
    { idReel: 4, idHashtag: 4, createdAt: new Date() }, // StylePro

    // Reel 5 – Uốn xoăn
    { idReel: 5, idHashtag: 10, createdAt: new Date() }, // WavyHair
    { idReel: 5, idHashtag: 3, createdAt: new Date() }, // LayerCut
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("reel_hashtags", null, {});
}
