"use strict";

// ════════════════════════════════════════════════════════════════════════════
// FILE 31 — customer_galleries
// Mỗi barber (36-50) chọn 2-4 booking, mỗi booking 4 ảnh
// Image URL lấy random từ file 1.txt (21 URLs), cho phép trùng
// ════════════════════════════════════════════════════════════════════════════

function seededRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}

const IMAGE_URLS = [
  "https://res.cloudinary.com/xuandung/image/upload/v1783420622/images_lzympw.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420622/images_1_l8sxnh.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420621/images_2_rfghrj.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420621/images_3_vs7gzi.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420620/images_4_xcw1if.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420619/images_5_xkr5lw.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420618/images_7_tmwpnd.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420619/images_6_s8almj.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420618/images_8_fibvts.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420618/images_9_coeq70.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420617/images_10_rbatbk.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420614/images_14_iwxfjy.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420615/images_11_uloxxl.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420614/images_13_kiqlcz.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420614/images_12_t0bcxd.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420614/images_16_nmrxth.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420614/images_15_uikxyb.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420614/images_17_vqgk3w.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420614/images_18_sbjtwd.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420614/images_19_aobhjk.jpg",
  "https://res.cloudinary.com/xuandung/image/upload/v1783420614/images_20_okrmpr.jpg",
];

const BARBER_IDS = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50];

export async function up(queryInterface) {
  // 1. Query tất cả bookings từ DB
  const dbBookings = await queryInterface.sequelize.query(
    `SELECT idBooking, idBarber FROM bookings ORDER BY idBarber`,
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  );

  // 2. Nhóm bookings theo idBarber
  const bookingsByBarber = {};
  for (const row of dbBookings) {
    const barberId = Number(row.idBarber);
    if (!bookingsByBarber[barberId]) {
      bookingsByBarber[barberId] = [];
    }
    bookingsByBarber[barberId].push(Number(row.idBooking));
  }

  // 3. Tạo records cho customer_galleries
  const records = [];

  for (const idBarber of BARBER_IDS) {
    const barberBookings = bookingsByBarber[idBarber] || [];
    if (barberBookings.length === 0) continue;

    const rng = seededRandom(idBarber * 5555);

    // Mỗi barber lấy 2-4 booking
    const numBookings = 2 + Math.floor(rng() * 3);

    // Shuffle và lấy booking
    const shuffled = [...barberBookings]
      .map(b => ({ b, r: rng() }))
      .sort((a, b) => a.r - b.r)
      .map(x => x.b)
      .slice(0, numBookings);

    for (const idBooking of shuffled) {
      // Mỗi booking 4 ảnh
      for (let i = 0; i < 4; i++) {
        const imageUrl = IMAGE_URLS[Math.floor(rng() * IMAGE_URLS.length)];
        records.push({
          idBooking,
          uploadBy: idBarber,
          imageUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }

  // 4. Insert
  if (records.length > 0) {
    await queryInterface.bulkInsert("customer_galleries", records);
  }

  console.log(`✅ [31] Inserted ${records.length} customer_galleries`);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("customer_galleries", null, {});
}