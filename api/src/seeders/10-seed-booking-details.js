"use strict";

// ════════════════════════════════════════════════════════════════════════════
// FILE 08b — booking_details
//
// Chạy SAU 08a-bookings.
//
// Chiến lược:
//   1. Query tất cả bookings từ DB (lấy idBooking, idBarber, bookingDate, bookingTime)
//   2. Dùng seeded RNG (cùng seed với 08a) để replay đúng service cho từng booking
//   3. Insert booking_details với idBooking thật từ DB
//
// Lý do dùng cùng seed:
//   - Đảm bảo service được chọn nhất quán với total đã insert ở 08a
//   - Không cần thêm cột bookingCode vào schema
//
// booking_details columns:
//   idBookingDetail (auto), idBooking, idService, idBarber, quantity, price
// ════════════════════════════════════════════════════════════════════════════

// ── Deterministic RNG — PHẢI GIỐNG HỆT 08a ─────────────────────────────────
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

// ── BARBER_CONFIGS — PHẢI GIỐNG HỆT 08a ────────────────────────────────────
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
const CUSTOMER_IDS    = [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25];
const AVG_BOOKING_VALUE = 130_000;
const BRANCH4_SUSPEND   = new Date("2026-04-01");
const DATA_CUTOFF       = { year: 2026, month: 5, day: 17 };

// Services có trong hệ thống
const SERVICES = [
  { idService: 1, price: 100_000 },
  { idService: 2, price: 150_000 },
  { idService: 3, price: 100_000 },
  { idService: 4, price:  50_000 },
  { idService: 5, price: 300_000 },
];

// ── Replay đúng sequence RNG của 08a để lấy service tương ứng ──────────────
// 08a gọi rng() theo thứ tự:
//   1. rng() → chọn price (AVG_SERVICE_PRICES[floor(rng * 5)])   ← pickTotal call 1
//   2. rng() → variance                                           ← pickTotal call 2
//   3. rng() → idCustomer
//   4. rng() → paymentMethod
// Vậy để lấy đúng service, ta phải replay ĐÚNG sequence này
function replayBookingRng(rng) {
  // Gọi đúng thứ tự như pickTotal trong 08a
  const svcIdx  = Math.floor(rng() * SERVICES.length); // call 1: chọn service
  rng();                                                // call 2: variance (bỏ qua)
  rng();                                                // call 3: idCustomer (bỏ qua)
  rng();                                                // call 4: paymentMethod (bỏ qua)
  return SERVICES[svcIdx];
}

export async function up(queryInterface) {
  await queryInterface.bulkDelete("booking_details", null, {});

  // ── Bước 1: Query tất cả bookings từ DB ─────────────────────────────────
  const dbBookings = await queryInterface.sequelize.query(
    `SELECT idBooking, idBarber, bookingDate, bookingTime
     FROM bookings
     ORDER BY idBarber ASC, bookingDate ASC, bookingTime ASC`,
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  );

  // Build map: "idBarber_YYYY-MM-DD_HH:MM" → idBooking
  const bookingMap = new Map();
  for (const row of dbBookings) {
    // bookingDate từ DB có thể là Date object hoặc string tùy driver
    const dateStr = typeof row.bookingDate === "string"
      ? row.bookingDate.slice(0, 10)
      : row.bookingDate.toISOString().slice(0, 10);
    const key = `${row.idBarber}_${dateStr}_${row.bookingTime}`;
    bookingMap.set(key, row.idBooking);
  }

  // ── Bước 2: Replay RNG để gán đúng service cho từng booking ─────────────
  const details = [];
  const periods = [];
  for (let m = 1; m <= 12; m++) periods.push({ year: 2025, month: m });
  for (let m = 1; m <=  5; m++) periods.push({ year: 2026, month: m });

  for (const cfg of BARBER_CONFIGS) {
    const rng       = seededRandom(cfg.idBarber * 31_337); // CÙNG SEED với 08a
    const startDate = new Date(cfg.startKey);
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

        // ── Replay: CN bỏ qua (consume rng() giống 08a) ──────────────────
        if (thisDay.getDay() === 0) {
          const skip = rng(); // consume CN check
          if (skip < 0.7) continue;
        }

        const dd      = String(day).padStart(2, "0");
        const mm      = String(month).padStart(2, "0");
        const dateStr = `${year}-${mm}-${dd}`;

        // ── Replay: shuffle shifts (consume dailyCount+1 calls) ───────────
        const shuffledShifts = [...SHIFTS]
          .map(s => ({ s, r: rng() }))   // consume SHIFTS.length calls
          .sort((a, b) => a.r - b.r)
          .map(x => x.s)
          .slice(0, dailyCount);

        for (const time of shuffledShifts) {
          // ── Replay: pickTotal (svcIdx + variance) + idCustomer + paymentMethod
          const svcIdx     = Math.floor(rng() * SERVICES.length); // service
          rng();                                                   // variance
          rng();                                                   // idCustomer
          rng();                                                   // paymentMethod

          const svc = SERVICES[svcIdx];
          const key = `${cfg.idBarber}_${dateStr}_${time}`;
          const idBooking = bookingMap.get(key);

          if (!idBooking) {
            // Booking không tìm thấy → skip (không throw để tránh crash toàn bộ)
            console.warn(`[08b] ⚠️  Không tìm thấy booking: ${key}`);
            continue;
          }

          details.push({
            idBooking,
            idService: svc.idService,
            idBarber:  cfg.idBarber,
            quantity:  1,
            price:     svc.price,   // giá niêm yết của service (không phải total)
            createdAt: new Date(`${dateStr}T${time}:00`),
            updatedAt: new Date(`${dateStr}T${time}:00`),
          });
        }
      }
    }
  }

  // ── Bước 3: Insert theo chunk ────────────────────────────────────────────
  const CHUNK = 500;
  for (let i = 0; i < details.length; i += CHUNK) {
    await queryInterface.bulkInsert("booking_details", details.slice(i, i + CHUNK));
  }

  console.log(`✅ [08b] Inserted ${details.length} booking_details`);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("booking_details", null, {});
}