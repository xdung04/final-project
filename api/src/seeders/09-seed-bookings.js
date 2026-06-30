"use strict";

// ════════════════════════════════════════════════════════════════════════════
// FILE 08a — bookings
//
// Tạo booking cho 40 barbers, 4 chi nhánh:
//   - 2025: 12 tháng đầy đủ (Jan → Dec)
//   - 2026: 5 tháng (Jan → May, giới hạn đến ngày 17/05/2026)
//   - Branch 4: chỉ đến 2026-03-31 (tạm ngưng 2026-04-01)
//
// Doanh thu mục tiêu theo cấp bậc:
//   Master  : 58–65tr/tháng
//   Senior  : 38–43tr/tháng
//   Junior active (đủ điều kiện): 30–36tr/tháng
//   Junior low    (fail lên cấp): 10–13tr/tháng
//   Junior new    (chưa đủ tháng): 20–22tr/tháng
//   Junior newest : 15–18tr/tháng
//
// Key duy nhất: (idBarber, bookingDate, bookingTime)
// → File 08b và 08c sẽ query theo composite key này để lấy idBooking
// ════════════════════════════════════════════════════════════════════════════

// ── Deterministic RNG (seed-based) ─────────────────────────────────────────
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

// ── Cấu hình từng barber ───────────────────────────────────────────────────
// monthlyRev: doanh thu mục tiêu/tháng (VNĐ)
// branch    : để lọc branch 4 khi tạm ngưng
// startKey  : ngày bắt đầu có data (YYYY-MM-DD)
const BARBER_CONFIGS = [
  // ── Branch 1 (idBarber 36–45) ──────────────────────────────────────────
  { idBarber: 36, branch: 1, monthlyRev: 60_000_000, startKey: "2025-01-01" }, // Master
  { idBarber: 37, branch: 1, monthlyRev: 42_000_000, startKey: "2025-01-01" }, // Senior
  { idBarber: 38, branch: 1, monthlyRev: 40_000_000, startKey: "2025-01-01" }, // Senior
  { idBarber: 39, branch: 1, monthlyRev: 35_000_000, startKey: "2025-01-01" }, // Junior active
  { idBarber: 40, branch: 1, monthlyRev: 33_000_000, startKey: "2025-01-01" }, // Junior active
  { idBarber: 41, branch: 1, monthlyRev: 34_000_000, startKey: "2025-02-01" }, // Junior active
  { idBarber: 42, branch: 1, monthlyRev: 32_000_000, startKey: "2025-03-01" }, // Junior active
  { idBarber: 43, branch: 1, monthlyRev: 13_000_000, startKey: "2025-01-01" }, // Junior low rev
  { idBarber: 44, branch: 1, monthlyRev: 22_000_000, startKey: "2025-10-01" }, // Junior chưa đủ tháng
  { idBarber: 45, branch: 1, monthlyRev: 18_000_000, startKey: "2026-01-01" }, // Junior newest

  // ── Branch 2 (idBarber 46–55) ──────────────────────────────────────────
  { idBarber: 46, branch: 2, monthlyRev: 62_000_000, startKey: "2025-01-01" }, // Master
  { idBarber: 47, branch: 2, monthlyRev: 41_000_000, startKey: "2025-01-01" }, // Senior
  { idBarber: 48, branch: 2, monthlyRev: 39_000_000, startKey: "2025-01-01" }, // Senior
  { idBarber: 49, branch: 2, monthlyRev: 36_000_000, startKey: "2025-01-01" }, // Junior active
  { idBarber: 50, branch: 2, monthlyRev: 33_000_000, startKey: "2025-01-01" }, // Junior active
  { idBarber: 51, branch: 2, monthlyRev: 31_000_000, startKey: "2025-02-01" }, // Junior active
  { idBarber: 52, branch: 2, monthlyRev: 30_000_000, startKey: "2025-03-01" }, // Junior active
  { idBarber: 53, branch: 2, monthlyRev: 12_000_000, startKey: "2025-01-01" }, // Junior low rev
  { idBarber: 54, branch: 2, monthlyRev: 21_000_000, startKey: "2025-10-01" }, // Junior chưa đủ tháng
  { idBarber: 55, branch: 2, monthlyRev: 17_000_000, startKey: "2026-01-01" }, // Junior newest

  // ── Branch 3 (idBarber 56–65) ──────────────────────────────────────────
  { idBarber: 56, branch: 3, monthlyRev: 58_000_000, startKey: "2025-01-01" }, // Master
  { idBarber: 57, branch: 3, monthlyRev: 43_000_000, startKey: "2025-01-01" }, // Senior
  { idBarber: 58, branch: 3, monthlyRev: 38_000_000, startKey: "2025-01-01" }, // Senior
  { idBarber: 59, branch: 3, monthlyRev: 34_000_000, startKey: "2025-01-01" }, // Junior active
  { idBarber: 60, branch: 3, monthlyRev: 32_000_000, startKey: "2025-01-01" }, // Junior active
  { idBarber: 61, branch: 3, monthlyRev: 33_000_000, startKey: "2025-02-01" }, // Junior active
  { idBarber: 62, branch: 3, monthlyRev: 31_000_000, startKey: "2025-03-01" }, // Junior active
  { idBarber: 63, branch: 3, monthlyRev: 11_000_000, startKey: "2025-01-01" }, // Junior low rev
  { idBarber: 64, branch: 3, monthlyRev: 20_000_000, startKey: "2025-10-01" }, // Junior chưa đủ tháng
  { idBarber: 65, branch: 3, monthlyRev: 16_000_000, startKey: "2026-01-01" }, // Junior newest

  // ── Branch 4 — Thủ Đức (idBarber 66–75) ───────────────────────────────
  // Tạm ngưng 2026-04-01 → không có booking từ tháng 4/2026 trở đi
  { idBarber: 66, branch: 4, monthlyRev: 38_000_000, startKey: "2025-01-01" }, // Senior
  { idBarber: 67, branch: 4, monthlyRev: 30_000_000, startKey: "2025-01-15" }, // Junior active
  { idBarber: 68, branch: 4, monthlyRev: 28_000_000, startKey: "2025-02-01" }, // Junior active
  { idBarber: 69, branch: 4, monthlyRev: 27_000_000, startKey: "2025-02-01" }, // Junior active
  { idBarber: 70, branch: 4, monthlyRev: 26_000_000, startKey: "2025-03-01" }, // Junior active
  { idBarber: 71, branch: 4, monthlyRev: 25_000_000, startKey: "2025-03-01" }, // Junior active
  { idBarber: 72, branch: 4, monthlyRev: 24_000_000, startKey: "2025-04-01" }, // Junior active
  { idBarber: 73, branch: 4, monthlyRev: 10_000_000, startKey: "2025-01-15" }, // Junior low rev
  { idBarber: 74, branch: 4, monthlyRev: 18_000_000, startKey: "2025-10-01" }, // Junior chưa đủ tháng
  { idBarber: 75, branch: 4, monthlyRev: 15_000_000, startKey: "2025-05-01" }, // Junior newest
];

// Ca làm việc trong ngày
const SHIFTS = ["09:00", "10:00", "13:00", "14:00", "16:00", "17:00", "19:00"];

// Danh sách customer để random (idCustomer 2–25)
const CUSTOMER_IDS = [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25];

// Giá dịch vụ trung bình để tính dailyCount
// (booking_details sẽ gắn service thật, file này chỉ cần total)
const AVG_SERVICE_PRICES = [100_000, 150_000, 100_000, 50_000, 300_000];
const AVG_BOOKING_VALUE  = 130_000; // trung bình mix services

// Branch 4 ngừng booking từ ngày này
const BRANCH4_SUSPEND = new Date("2026-04-01");

// Ngày cuối có data (17/05/2026)
const DATA_CUTOFF = { year: 2026, month: 5, day: 17 };

// ── Tính total cho 1 booking (dựa vào RNG để có biến động thực tế) ─────────
function pickTotal(rng) {
  const prices = AVG_SERVICE_PRICES;
  const base = prices[Math.floor(rng() * prices.length)];
  // ±20% biến động giá
  const variance = 1 + (rng() - 0.5) * 0.4;
  return Math.round((base * variance) / 1000) * 1000;
}

// ── Build danh sách tất cả bookings ────────────────────────────────────────
export async function up(queryInterface) {
  await queryInterface.bulkDelete("booking_details", null, {});
  await queryInterface.bulkDelete("booking_tips",    null, {});
  await queryInterface.bulkDelete("bookings",        null, {});

  const bookings = [];

  // Periods: 2025-01 → 2026-05
  const periods = [];
  for (let m = 1; m <= 12; m++) periods.push({ year: 2025, month: m });
  for (let m = 1; m <=  5; m++) periods.push({ year: 2026, month: m });

  for (const cfg of BARBER_CONFIGS) {
    // Mỗi barber dùng seed riêng → data deterministic, không trùng lẫn
    const rng       = seededRandom(cfg.idBarber * 31_337);
    const startDate = new Date(cfg.startKey);

    // Số booking/ngày cần thiết để đạt doanh thu mục tiêu
    // (22 ngày làm/tháng là chuẩn ngành)
    const targetRevPerDay = cfg.monthlyRev / 22;
    const dailyCount = Math.min(6, Math.max(2, Math.round(targetRevPerDay / AVG_BOOKING_VALUE)));

    for (const { year, month } of periods) {
      const periodStart = new Date(year, month - 1, 1);

      // Branch 4: không tạo booking sau ngày tạm ngưng
      if (cfg.branch === 4 && periodStart >= BRANCH4_SUSPEND) continue;
      // Barber mới: không tạo booking trước ngày join
      if (periodStart < startDate) continue;

      const totalDays = daysInMonth(year, month);
      // Giới hạn ngày cuối của tháng (nếu là tháng hiện tại)
      const limitDay = (year === DATA_CUTOFF.year && month === DATA_CUTOFF.month)
        ? DATA_CUTOFF.day
        : totalDays;

      for (let day = 1; day <= limitDay; day++) {
        // Nếu barber join giữa tháng thì bỏ qua những ngày trước join
        const thisDay = new Date(year, month - 1, day);
        if (thisDay < startDate) continue;

        // Chủ nhật: 70% không làm (thực tế barber nghỉ CN)
        if (thisDay.getDay() === 0 && rng() < 0.7) continue;

        const dd      = String(day).padStart(2, "0");
        const mm      = String(month).padStart(2, "0");
        const dateStr = `${year}-${mm}-${dd}`;

        // Chọn ngẫu nhiên `dailyCount` ca từ SHIFTS (không trùng ca)
        // sort by rng() để shuffle, rồi slice
        const shuffledShifts = [...SHIFTS]
          .map(s => ({ s, r: rng() }))
          .sort((a, b) => a.r - b.r)
          .map(x => x.s)
          .slice(0, dailyCount);

        for (const time of shuffledShifts) {
          const total = pickTotal(rng);

          bookings.push({
            idCustomer:        CUSTOMER_IDS[Math.floor(rng() * CUSTOMER_IDS.length)],
            idBarber:          cfg.idBarber,
            idCustomerVoucher: null,
            guestCount:        1,
            bookingDate:       dateStr,
            bookingTime:       time,
            status:            "Completed",
            description:       null,
            total,
            isPaid:            true,
            paymentMethod:     rng() > 0.45 ? "Transfer" : "Cash",
            createdAt:         new Date(`${dateStr}T${time}:00`),
            updatedAt:         new Date(`${dateStr}T${time}:00`),
          });
        }
      }
    }
  }

  // Insert theo chunk 500 để tránh timeout
  const CHUNK = 500;
  for (let i = 0; i < bookings.length; i += CHUNK) {
    await queryInterface.bulkInsert("bookings", bookings.slice(i, i + CHUNK));
  }

  console.log(`✅ [08a] Inserted ${bookings.length} bookings`);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("booking_details", null, {});
  await queryInterface.bulkDelete("booking_tips",    null, {});
  await queryInterface.bulkDelete("bookings",        null, {});
}