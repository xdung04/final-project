"use strict";

// ════════════════════════════════════════════════════════════════════════════
// FILE 19 — reel_views
// 19 reels, mỗi reel 10-20 views
// Composite PK: (idReel, idUser)
// User pool: 1 (admin), 2-31 (customer), 36-50 (barber)
// ════════════════════════════════════════════════════════════════════════════

function seededRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}

const USERS_POOL = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
  36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
  46, 47, 48, 49, 50,
];

export async function up(queryInterface) {
  await queryInterface.bulkDelete("reel_views", null, {});

  const views = [];

  for (let idReel = 1; idReel <= 19; idReel++) {
    const rng = seededRandom(idReel * 9999);
    // Số views cho reel này: 10-20
    const numViews = 10 + Math.floor(rng() * 11);

    // Shuffle users pool để pick ngẫu nhiên không trùng
    const shuffled = [...USERS_POOL]
      .map(u => ({ u, r: rng() }))
      .sort((a, b) => a.r - b.r)
      .map(x => x.u)
      .slice(0, numViews);

    for (const idUser of shuffled) {
      views.push({
        idReel,
        idUser,
        lastViewedAt: new Date("2026-07-01"),
      });
    }
  }

  await queryInterface.bulkInsert("reel_views", views);
  console.log(`✅ [19] Inserted ${views.length} reel_views`);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("reel_views", null, {});
}