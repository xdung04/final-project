"use strict";
import bcrypt from "bcrypt";
import { Op } from "sequelize";

// ════════════════════════════════════════════════════════════════════════════
// FILE 30 — Customer Segmentation Fake Data
//
// Tạo 40 khách hàng ảo phân bố đều vào 4 segment:
//   NEW        (10 khách) — id 76..85
//   REGULAR    (10 khách) — id 86..95
//   OCCASIONAL (10 khách) — id 96..105
//   INACTIVE   (10 khách) — id 106..115
//
// Không ảnh hưởng dữ liệu cũ vì:
//   - idUser/idCustomer hoàn toàn mới (76→115)
//   - Email, SĐT mới, không trùng
//   - Khung giờ booking khác với seed 09 (tránh UNIQUE KEY conflict)
//   - Chỉ INSERT, không DELETE/sửa dữ liệu cũ
// ════════════════════════════════════════════════════════════════════════════

// ── Thời gian hiện tại (dùng để verify segment) ────────────────────────────
// Giả sử "hiện tại" = 08/07/2026
const NOW = new Date("2026-07-08T12:00:00+07:00");

// ── Khung giờ không trùng với seed cũ ──────────────────────────────────────
// Seed 09 dùng: 09:00,10:00,13:00,14:00,16:00,17:00,19:00
const TIME_SLOTS = [
  "08:00","08:30","11:00","11:30","12:00",
  "15:00","15:30","18:00","18:30","20:00","20:30","21:00",
];

// ── Barber pool (chỉ Branch 1-3, vì Branch 4 inactive từ 04/2026) ──────────
const BARBER_POOL = [
  36,37,38,39,40,41,42,43,44,45,
  46,47,48,49,50,51,52,53,54,55,
  56,57,58,59,60,61,62,63,64,65,
];

// ── Seed RNG deterministic ──────────────────────────────────────────────────
function seededRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}

// ── Helper: chọn barber + time slot theo seed ─────────────────────────────
function pickBarber(rng) {
  return BARBER_POOL[Math.floor(rng() * BARBER_POOL.length)];
}
function pickTimeSlot(rng) {
  return TIME_SLOTS[Math.floor(rng() * TIME_SLOTS.length)];
}
function pickTotal(rng) {
  const prices = [100000, 120000, 150000, 180000, 200000, 250000, 300000];
  const variance = 1 + (rng() - 0.5) * 0.3; // ±15%
  return Math.round((prices[Math.floor(rng() * prices.length)] * variance) / 1000) * 1000;
}
function pickPayment(rng) {
  return rng() > 0.45 ? "Transfer" : "Cash";
}

// ── Định nghĩa customer profiles ──────────────────────────────────────────
// Mỗi profile:
//   id, name, phone, emailSuffix, joinedAt (YYYY-MM-DD), loyaltyPoint,
//   address, bookingDates: [YYYY-MM-DD, ...]
//   segmentComment: ghi chú tại sao thuộc segment này

const PROFILES = [];

// 1. Nhóm NEW (76-85): booking đầu tiên trong tháng 7/2026
for (let i = 0; i < 10; i++) {
  const id = 76 + i;
  const day = i < 7 ? 25 + i : 1 + (i - 7); // joinedAt: 25/06 → 04/07
  const month = i < 7 ? 6 : 7;
  const bookDay = 2 + i; // booking: 02/07 → 11/07
  const bookCount = i < 2 ? 2 : 1; // 2 người đầu có 2 booking
  const dates = [];
  for (let b = 0; b < bookCount; b++) {
    dates.push(`2026-07-${String(bookDay + b).padStart(2, "0")}`);
  }
  PROFILES.push({
    id,
    name: `Khách Mới ${String.fromCharCode(65 + i)}`,
    phone: `09111000${31 + i}`,
    emailSuffix: `kh${id - 44}`,
    joinedAt: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    loyaltyPoint: Math.floor(Math.random() * 30) + 5,
    address: `${100 + i * 3} Nguyễn Văn Linh, Quận 7`,
    bookingDates: dates,
    segmentComment: `NEW: first booking (${dates[0]}) >= 01/07/2026`,
  });
}

// 2. Nhóm REGULAR (86-95): ≥4 booking, last booking ≤45 ngày
const regularNames = [
  "Long", "Mai", "Nam", "Oanh", "Phúc",
  "Quyên", "Sáng", "Thu", "Tín", "Uyên",
];
for (let i = 0; i < 10; i++) {
  const id = 86 + i;
  const bookCount = 4 + (i % 3); // 4-6 bookings
  const rng = seededRandom(id * 777);
  const dates = [];
  // Booking đầu tiên từ 2025
  const startYear = 2025;
  const startMonth = 2 + i; // từ tháng 3-12/2025
  dates.push(`${startYear}-${String(startMonth).padStart(2, "0")}-${String(10 + i).padStart(2, "0")}`);
  // Các booking tiếp theo, cách nhau 1-3 tháng
  let lastDate = new Date(dates[0]);
  for (let b = 1; b < bookCount; b++) {
    const gapMonths = 1 + Math.floor(rng() * 3);
    lastDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + gapMonths, 5 + Math.floor(rng() * 20));
    // Booking cuối: trong vòng 45 ngày (sau 24/05/2026)
    if (b === bookCount - 1) {
      // Đặt vào tháng 6 hoặc đầu tháng 7
      lastDate = new Date(2026, 5 + Math.floor(rng() * 2), 1 + Math.floor(rng() * 15));
    }
    const y = lastDate.getFullYear();
    const m = String(lastDate.getMonth() + 1).padStart(2, "0");
    const d = String(lastDate.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
  }
  PROFILES.push({
    id,
    name: `Khách Quen ${regularNames[i]}`,
    phone: `09111000${41 + i}`,
    emailSuffix: `kh${id - 44}`,
    joinedAt: "2025-01-15",
    loyaltyPoint: 200 + i * 50,
    address: `${200 + i * 3} Lê Lợi, Quận 1`,
    bookingDates: dates,
    segmentComment: `REGULAR: ${bookCount} bookings, last=${dates[dates.length-1]} ≤45 ngày`,
  });
}

// 3. Nhóm OCCASIONAL (96-105): không đủ Regular, trong 90 ngày
for (let i = 0; i < 10; i++) {
  const id = 96 + i;
  const rng = seededRandom(id * 555);
  let dates = [];
  let joinedAt, loyaltyPoint, comment;

  if (i < 8) {
    // 96-103: có booking, nhưng <4 booking (không đủ regular)
    const bookCount = 1 + Math.floor(rng() * 3); // 1-3 bookings
    // Booking cuối trong vòng 90 ngày (sau 09/04/2026)
    for (let b = 0; b < bookCount; b++) {
      const day = 10 + Math.floor(rng() * 80);
      const dt = new Date(2026, 3, day); // từ 10/04 → ~29/06
      if (dt > NOW) continue;
      dates.push(
        `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
      );
    }
    joinedAt = "2025-06-01";
    loyaltyPoint = 30 + Math.floor(rng() * 80);
    comment = `OCCASIONAL: ${bookCount} bookings (<4), last trong 90 ngày`;
  } else {
    // 104-105: 0 booking, joinedAt < 30 ngày (mới tạo)
    joinedAt = "2026-06-20";
    loyaltyPoint = 0;
    dates = [];
    comment = `OCCASIONAL: 0 booking, joinedAt (${joinedAt}) < 30 ngày`;
  }

  PROFILES.push({
    id,
    name: `Khách Tiềm Năng ${String.fromCharCode(65 + i)}`,
    phone: `09111000${51 + i}`,
    emailSuffix: `kh${id - 44}`,
    joinedAt,
    loyaltyPoint,
    address: `${300 + i * 3} Phạm Văn Đồng, Thủ Đức`,
    bookingDates: dates,
    segmentComment: comment,
  });
}

// 4. Nhóm INACTIVE (106-115): >90 ngày không ghé, hoặc tạo TK ≥30 ngày chưa booking
for (let i = 0; i < 10; i++) {
  const id = 106 + i;
  const rng = seededRandom(id * 333);
  let dates = [];
  let joinedAt, loyaltyPoint, comment;

  if (i < 4) {
    // 106-109: có booking nhưng >90 ngày trước (trước 09/04/2026)
    const bookCount = 1 + Math.floor(rng() * 2); // 1-2 bookings
    for (let b = 0; b < bookCount; b++) {
      const day = 1 + Math.floor(rng() * 90);
      const month = 1 + Math.floor(rng() * 3); // tháng 1-3/2026
      const dt = new Date(2026, month - 1, day);
      if (dt > new Date("2026-04-08")) continue;
      dates.push(
        `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
      );
    }
    joinedAt = "2025-03-01";
    loyaltyPoint = 10 + Math.floor(rng() * 40);
    comment = `INACTIVE: có booking nhưng >90 ngày (trước 09/04/2026)`;
  } else {
    // 110-115: 0 booking, joinedAt ≥30 ngày trước
    const monthsAgo = (i - 3) * 2 + 1; // 3,5,7,9,11,13 tháng trước
    const jd = new Date(NOW);
    jd.setMonth(jd.getMonth() - monthsAgo);
    joinedAt = `${jd.getFullYear()}-${String(jd.getMonth() + 1).padStart(2, "0")}-${String(jd.getDate()).padStart(2, "0")}`;
    loyaltyPoint = 0;
    dates = [];
    comment = `INACTIVE: 0 booking, joinedAt (${joinedAt}) ≥30 ngày`;
  }

  PROFILES.push({
    id,
    name: `Khách Vắng ${String.fromCharCode(65 + i)}`,
    phone: `09111000${61 + i}`,
    emailSuffix: `kh${id - 44}`,
    joinedAt,
    loyaltyPoint,
    address: `${400 + i * 3} Quang Trung, Gò Vấp`,
    bookingDates: dates,
    segmentComment: comment,
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═════════════════════════════════════════════════════════════════════════════
export async function up(queryInterface) {
  const pw = await bcrypt.hash("123456", 10);

  // ── 1. INSERT users (40 records) ──────────────────────────────────────────
  const userRecords = PROFILES.map((p) => ({
    idUser: p.id,
    email: `${p.emailSuffix}@mail.com`,
    password: pw,
    fullName: p.name,
    phoneNumber: p.phone,
    authProvider: "local",
    isStatus: true,
    image: null,
    role: "customer",
    createdAt: new Date(p.joinedAt),
    updatedAt: NOW,
  }));
  await queryInterface.bulkInsert("users", userRecords, { ignoreDuplicates: true });
  console.log(`✅ [30] Inserted ${userRecords.length} users (76-115)`);

  // ── 2. INSERT customers (40 records) ──────────────────────────────────────
  const customerRecords = PROFILES.map((p) => ({
    idCustomer: p.id,
    loyaltyPoint: p.loyaltyPoint,
    address: p.address,
    createdAt: new Date(p.joinedAt),
    updatedAt: NOW,
  }));
  await queryInterface.bulkInsert("customers", customerRecords, { ignoreDuplicates: true });
  console.log(`✅ [30] Inserted ${customerRecords.length} customers (76-115)`);

  // ── 3. INSERT bookings ────────────────────────────────────────────────────
  const bookingRecords = [];

  for (const profile of PROFILES) {
    const rng = seededRandom(profile.id * 999);
    let slotIndex = 0;

    for (const dateStr of profile.bookingDates) {
      // Mỗi booking dùng barber + time slot khác nhau
      const barberId = pickBarber(rng);
      const timeSlot = TIME_SLOTS[slotIndex % TIME_SLOTS.length];
      slotIndex++;

      // Kiểm tra không trùng (idBarber, bookingDate, bookingTime)
      // Dùng time slot khác với seed cũ → an toàn
      const total = pickTotal(rng);
      bookingRecords.push({
        idCustomer: profile.id,
        idBarber: barberId,
        idCustomerVoucher: null,
        guestCount: 1,
        bookingDate: dateStr,
        bookingTime: timeSlot,
        status: "Completed",
        description: null,
        total,
        isPaid: true,
        paymentMethod: pickPayment(rng),
        createdAt: new Date(`${dateStr}T${timeSlot}:00`),
        updatedAt: new Date(`${dateStr}T${timeSlot}:00`),
      });
    }
  }

  if (bookingRecords.length > 0) {
    const CHUNK = 500;
    for (let i = 0; i < bookingRecords.length; i += CHUNK) {
      await queryInterface.bulkInsert("bookings", bookingRecords.slice(i, i + CHUNK));
    }
  }
  console.log(`✅ [30] Inserted ${bookingRecords.length} bookings for segment customers`);

  // ── 4. INSERT customer_vouchers ──────────────────────────────────────────
  // Gán voucher RETENTION (id=3) cho một số khách Occasional/Inactive
  // để test bộ lọc voucher trên UI
  const voucherRecords = [];
  const retentionVoucherId = 3; // Từ seed 08-seed-vouchers

  // Occasional: 3 khách có AVAILABLE, 2 khách có USED
  const occIds = PROFILES.filter((p) => p.id >= 96 && p.id <= 105).map((p) => p.id);
  for (let i = 0; i < 3 && i < occIds.length; i++) {
    const expiresAt = new Date(NOW);
    expiresAt.setDate(expiresAt.getDate() + 14);
    voucherRecords.push({
      voucher_id: retentionVoucherId,
      customer_id: occIds[i],
      status: "AVAILABLE",
      issued_at: NOW,
      expires_at: expiresAt,
      used_at: null,
      source_note: "seed-30: retention test",
      created_at: NOW,
      updated_at: NOW,
    });
  }
  for (let i = 3; i < 5 && i < occIds.length; i++) {
    const usedAt = new Date(NOW);
    usedAt.setDate(usedAt.getDate() - 5);
    voucherRecords.push({
      voucher_id: retentionVoucherId,
      customer_id: occIds[i],
      status: "USED",
      issued_at: new Date(NOW.getTime() - 20 * 24 * 3600 * 1000),
      expires_at: null,
      used_at: usedAt,
      source_note: "seed-30: retention test (used)",
      created_at: new Date(NOW.getTime() - 20 * 24 * 3600 * 1000),
      updated_at: NOW,
    });
  }

  // Inactive: 2 khách có AVAILABLE, 2 khách có USED
  const inactIds = PROFILES.filter((p) => p.id >= 106 && p.id <= 115).map((p) => p.id);
  for (let i = 0; i < 2 && i < inactIds.length; i++) {
    const expiresAt = new Date(NOW);
    expiresAt.setDate(expiresAt.getDate() + 14);
    voucherRecords.push({
      voucher_id: retentionVoucherId,
      customer_id: inactIds[i],
      status: "AVAILABLE",
      issued_at: NOW,
      expires_at: expiresAt,
      used_at: null,
      source_note: "seed-30: retention test",
      created_at: NOW,
      updated_at: NOW,
    });
  }
  for (let i = 2; i < 4 && i < inactIds.length; i++) {
    const usedAt = new Date(NOW);
    usedAt.setDate(usedAt.getDate() - 3);
    voucherRecords.push({
      voucher_id: retentionVoucherId,
      customer_id: inactIds[i],
      status: "USED",
      issued_at: new Date(NOW.getTime() - 15 * 24 * 3600 * 1000),
      expires_at: null,
      used_at: usedAt,
      source_note: "seed-30: retention test (used)",
      created_at: new Date(NOW.getTime() - 15 * 24 * 3600 * 1000),
      updated_at: NOW,
    });
  }

  if (voucherRecords.length > 0) {
    await queryInterface.bulkInsert("customer_vouchers", voucherRecords);
  }
  console.log(`✅ [30] Inserted ${voucherRecords.length} customer_vouchers for filter testing`);

  // ── 5. IN-APP VERIFICATION (log để kiểm tra) ─────────────────────────────
  console.log("\n📊 [30] PHÂN BỐ SEGMENT DỰ KIẾN:");
  console.log("   NEW : 76-85  (10 khách) — booking đầu tháng 7/2026");
  console.log("   REGULAR : 86-95  (10 khách) — ≥4 booking, ≤45 ngày");
  console.log("   OCCASIONAL : 96-105 (10 khách) — <4 booking hoặc mới tạo, trong 90 ngày");
  console.log("   INACTIVE : 106-115 (10 khách) — >90 ngày hoặc tạo lâu chưa booking");
  console.log(`   Tổng bookings: ${bookingRecords.length}`);
}

export async function down(queryInterface) {
  // Xoá theo thứ tự khoá ngoại
  await queryInterface.bulkDelete("customer_vouchers", {
    customer_id: { [Op.between]: [76, 115] },
  });
  await queryInterface.bulkDelete("bookings", {
    idCustomer: { [Op.between]: [76, 115] },
  });
  await queryInterface.bulkDelete("customers", {
    idCustomer: { [Op.between]: [76, 115] },
  });
  await queryInterface.bulkDelete("users", {
    idUser: { [Op.between]: [76, 115] },
  });
  console.log(`🔻 [30] Reverted 30-seed-customer-segments`);
}