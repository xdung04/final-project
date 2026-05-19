"use strict";

// ════════════════════════════════════════════════════════════════════════════
// FILE 08c — booking_tips
//
// Chạy SAU 08a-bookings (và có thể chạy song song với 08b).
//
// Logic:
//   - ~40% booking được tip (random seeded, deterministic)
//   - Tip amount: 20k → 100k (bước 10k)
//   - Dùng seed KHÁC với 08a/08b để tránh correlation
//     Seed: idBarber * 99_991 (số nguyên tố khác với 31_337)
//
// booking_tips columns:
//   idTip (auto), idBooking, idBarber, tipAmount, createdAt, updatedAt
// ════════════════════════════════════════════════════════════════════════════

// ── Deterministic RNG ───────────────────────────────────────────────────────
function seededRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// ── BARBER_CONFIGS — PHẢI GIỐNG HỆT 08a (để replay đúng ngày/ca) ───────────
const BARBER_CONFIGS = [
  // Branch 1
  { idBarber: 36, branch: 1, monthlyRev: 60_000_000, startKey: "2025-01-01" },
  { idBarber: 37, branch: 1, monthlyRev: 42_000_000, startKey: "2025-01-01" },
  { idBarber: 38, branch: 1, monthlyRev: 40_000_000, startKey: "2025-01-01" },
  { idBarber: 39, branch: 1, monthlyRev: 35_000_000, startKey: "2025-01-01" },
  { idBarber: 40, branch: 1, monthlyRev: 33_000_000, startKey: "2025-01-01" },
  { idBarber: 41, branch: 1, monthlyRev: 34_000_000, startKey: "2025-02-01" },
  { idBarber: 42, branch: 1, monthlyRev: 32_000_000, startKey: "2025-03-01" },
  { idBarber: 43, branch: 1, monthlyRev: 13_000_000, startKey: "2025-01-01" },
  { idBarber: 44, branch: 1, monthlyRev: 22_000_000, startKey: "2025-10-01" },
  { idBarber: 45, branch: 1, monthlyRev: 18_000_000, startKey: "2026-01-01" },
  // Branch 2
  { idBarber: 46, branch: 2, monthlyRev: 62_000_000, startKey: "2025-01-01" },
  { idBarber: 47, branch: 2, monthlyRev: 41_000_000, startKey: "2025-01-01" },
  { idBarber: 48, branch: 2, monthlyRev: 39_000_000, startKey: "2025-01-01" },
  { idBarber: 49, branch: 2, monthlyRev: 36_000_000, startKey: "2025-01-01" },
  { idBarber: 50, branch: 2, monthlyRev: 33_000_000, startKey: "2025-01-01" },
  { idBarber: 51, branch: 2, monthlyRev: 31_000_000, startKey: "2025-02-01" },
  { idBarber: 52, branch: 2, monthlyRev: 30_000_000, startKey: "2025-03-01" },
  { idBarber: 53, branch: 2, monthlyRev: 12_000_000, startKey: "2025-01-01" },
  { idBarber: 54, branch: 2, monthlyRev: 21_000_000, startKey: "2025-10-01" },
  { idBarber: 55, branch: 2, monthlyRev: 17_000_000, startKey: "2026-01-01" },
  // Branch 3
  { idBarber: 56, branch: 3, monthlyRev: 58_000_000, startKey: "2025-01-01" },
  { idBarber: 57, branch: 3, monthlyRev: 43_000_000, startKey: "2025-01-01" },
  { idBarber: 58, branch: 3, monthlyRev: 38_000_000, startKey: "2025-01-01" },
  { idBarber: 59, branch: 3, monthlyRev: 34_000_000, startKey: "2025-01-01" },
  { idBarber: 60, branch: 3, monthlyRev: 32_000_000, startKey: "2025-01-01" },
  { idBarber: 61, branch: 3, monthlyRev: 33_000_000, startKey: "2025-02-01" },
  { idBarber: 62, branch: 3, monthlyRev: 31_000_000, startKey: "2025-03-01" },
  { idBarber: 63, branch: 3, monthlyRev: 11_000_000, startKey: "2025-01-01" },
  { idBarber: 64, branch: 3, monthlyRev: 20_000_000, startKey: "2025-10-01" },
  { idBarber: 65, branch: 3, monthlyRev: 16_000_000, startKey: "2026-01-01" },
  // Branch 4
  { idBarber: 66, branch: 4, monthlyRev: 38_000_000, startKey: "2025-01-01" },
  { idBarber: 67, branch: 4, monthlyRev: 30_000_000, startKey: "2025-01-15" },
  { idBarber: 68, branch: 4, monthlyRev: 28_000_000, startKey: "2025-02-01" },
  { idBarber: 69, branch: 4, monthlyRev: 27_000_000, startKey: "2025-02-01" },
  { idBarber: 70, branch: 4, monthlyRev: 26_000_000, startKey: "2025-03-01" },
  { idBarber: 71, branch: 4, monthlyRev: 25_000_000, startKey: "2025-03-01" },
  { idBarber: 72, branch: 4, monthlyRev: 24_000_000, startKey: "2025-04-01" },
  { idBarber: 73, branch: 4, monthlyRev: 10_000_000, startKey: "2025-01-15" },
  { idBarber: 74, branch: 4, monthlyRev: 18_000_000, startKey: "2025-10-01" },
  { idBarber: 75, branch: 4, monthlyRev: 15_000_000, startKey: "2025-05-01" },
];

const SHIFTS          = ["09:00", "10:30", "13:00", "14:30", "16:00", "17:30", "19:00"];
const AVG_BOOKING_VALUE = 130_000;
const BRANCH4_SUSPEND   = new Date("2026-04-01");
const DATA_CUTOFF       = { year: 2026, month: 5, day: 17 };

export async function up(queryInterface) {
  await queryInterface.bulkDelete("booking_tips", null, {});

  // ── Bước 1: Query tất cả bookings từ DB ─────────────────────────────────
  const dbBookings = await queryInterface.sequelize.query(
    `SELECT idBooking, idBarber, bookingDate, bookingTime
     FROM bookings
     ORDER BY idBarber ASC, bookingDate ASC, bookingTime ASC`,
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  );

  // Build map: "idBarber_YYYY-MM-DD_HH:MM" → { idBooking, bookingDate, bookingTime }
  const bookingMap = new Map();
  for (const row of dbBookings) {
    const dateStr = typeof row.bookingDate === "string"
      ? row.bookingDate.slice(0, 10)
      : row.bookingDate.toISOString().slice(0, 10);
    const key = `${row.idBarber}_${dateStr}_${row.bookingTime}`;
    bookingMap.set(key, { idBooking: row.idBooking, dateStr, time: row.bookingTime });
  }

  // ── Bước 2: Tạo tips với seed RIÊNG (không phụ thuộc vào 08a sequence) ──
  // Dùng seed = idBarber * 99_991 → độc lập hoàn toàn với 08a
  // Nhưng vẫn cần replay ĐÚNG danh sách ngày/ca (giống 08a) để biết
  // booking nào tồn tại → dùng rng_nav (navigate) để tái tạo lịch,
  // rng_tip (tip decision) để quyết định có tip không
  const tips    = [];
  const periods = [];
  for (let m = 1; m <= 12; m++) periods.push({ year: 2025, month: m });
  for (let m = 1; m <=  5; m++) periods.push({ year: 2026, month: m });

  for (const cfg of BARBER_CONFIGS) {
    // rng_nav: replay lịch ngày/ca (CÙNG seed 08a để biết CN nào bỏ qua)
    const rng_nav = seededRandom(cfg.idBarber * 31_337);
    // rng_tip: quyết định tip (seed KHÁC để tránh correlation)
    const rng_tip = seededRandom(cfg.idBarber * 99_991);

    const startDate  = new Date(cfg.startKey);
    const dailyCount = Math.min(6, Math.max(2, Math.round((cfg.monthlyRev / 22) / AVG_BOOKING_VALUE)));

    for (const { year, month } of periods) {
      const periodStart = new Date(year, month - 1, 1);
      if (cfg.branch === 4 && periodStart >= BRANCH4_SUSPEND) continue;
      if (periodStart < startDate) continue;

      const totalDays = daysInMonth(year, month);
      const limitDay  = (year === DATA_CUTOFF.year && month === DATA_CUTOFF.month)
        ? DATA_CUTOFF.day : totalDays;

      for (let day = 1; day <= limitDay; day++) {
        const thisDay = new Date(year, month - 1, day);
        if (thisDay < startDate) continue;

        // ── Replay CN check (consume rng_nav giống 08a) ──────────────────
        if (thisDay.getDay() === 0) {
          const skip = rng_nav();
          if (skip < 0.7) continue;
        }

        const dd      = String(day).padStart(2, "0");
        const mm      = String(month).padStart(2, "0");
        const dateStr = `${year}-${mm}-${dd}`;

        // ── Replay shuffle shifts (consume SHIFTS.length calls) ───────────
        const shuffledShifts = [...SHIFTS]
          .map(s => ({ s, r: rng_nav() }))
          .sort((a, b) => a.r - b.r)
          .map(x => x.s)
          .slice(0, dailyCount);

        for (const time of shuffledShifts) {
          // Consume 4 RNG calls của 08a (svcIdx, variance, idCustomer, paymentMethod)
          rng_nav(); // svcIdx
          rng_nav(); // variance
          rng_nav(); // idCustomer
          rng_nav(); // paymentMethod

          const key = `${cfg.idBarber}_${dateStr}_${time}`;
          const booking = bookingMap.get(key);
          if (!booking) {
            console.warn(`[08c] ⚠️  Không tìm thấy booking: ${key}`);
            continue;
          }

          // ── Quyết định có tip không (dùng rng_tip, độc lập) ─────────────
          if (rng_tip() < 0.40) {
            // Tip amount: 20k → 100k, bước 10k (9 giá trị: 20,30,...,100)
            const tipAmount = (Math.floor(rng_tip() * 9) + 2) * 10_000;
            tips.push({
              idBooking: booking.idBooking,
              idBarber:  cfg.idBarber,
              tipAmount,
              createdAt: new Date(`${dateStr}T${time}:00`),
              updatedAt: new Date(`${dateStr}T${time}:00`),
            });
          }
        }
      }
    }
  }

  // ── Bước 3: Insert theo chunk ────────────────────────────────────────────
  const CHUNK = 500;
  for (let i = 0; i < tips.length; i += CHUNK) {
    await queryInterface.bulkInsert("booking_tips", tips.slice(i, i + CHUNK));
  }

  const tipRate = dbBookings.length > 0
    ? ((tips.length / dbBookings.length) * 100).toFixed(1)
    : 0;

  console.log(`✅ [08c] Inserted ${tips.length} tips (~${tipRate}% booking có tip)`);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("booking_tips", null, {});
}