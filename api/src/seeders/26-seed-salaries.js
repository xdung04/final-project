"use strict";

// ════════════════════════════════════════════════════════════════════════════
// FILE 10 — salaries (chạy SAU barber_day_offs)
//
// Flow:
//   1. Query barber_day_offs → tính daysOff cho từng tháng
//   2. baseSalaryActual = baseSalary / daysInMonth * daysWorked
//   3. netSalary = baseSalaryActual + commission + tips + bonus - deductions
//
// Điều kiện lên cấp (giảm xuống chỉ 2 thợ đủ):
//   Junior → Senior: rev >= 30tr/tháng, >= 6 tháng ở level, 3 tháng liên tiếp đạt
//   Senior → Master: rev >= 50tr/tháng, >= 12 tháng ở level, 3 tháng liên tiếp đạt
//   → Chỉ barber 39 (Junior→Senior) và barber 47 (Senior→Master) đủ điều kiện
//   → Các thợ khác thiếu doanh thu HOẶC thiếu thâm niên
// ════════════════════════════════════════════════════════════════════════════

function daysInMonthFn(year, month) {
  return new Date(year, month, 0).getDate();
}

function countDaysOffInMonth(dayOffs, idBarber, year, month) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay  = new Date(year, month - 1, daysInMonthFn(year, month));

  return dayOffs
    .filter((d) => Number(d.idBarber) === idBarber)
    .reduce((total, d) => {
      const s = new Date(d.startDate) < firstDay ? firstDay : new Date(d.startDate);
      const e = new Date(d.endDate)   > lastDay  ? lastDay  : new Date(d.endDate);
      if (s > e) return total;
      return total + Math.round((e - s) / 86400000) + 1;
    }, 0);
}

function calcCommission(rev, planType) {
  const RATES = {
    junior:     [{ max: 20_000_000, rate: 0.08 }, { max: 40_000_000, rate: 0.10 }, { max: Infinity, rate: 0.12 }],
    senior:     [{ max: 20_000_000, rate: 0.10 }, { max: 40_000_000, rate: 0.12 }, { max: Infinity, rate: 0.14 }],
    master:     [{ max: 20_000_000, rate: 0.12 }, { max: 40_000_000, rate: 0.15 }, { max: Infinity, rate: 0.18 }],
    junior2024: [{ max: 20_000_000, rate: 0.07 }, { max: 40_000_000, rate: 0.09 }, { max: Infinity, rate: 0.11 }],
  };
  let commission = 0, remaining = rev, prev = 0;
  for (const { max, rate } of RATES[planType]) {
    if (remaining <= 0) break;
    const chunk = max === Infinity ? remaining : Math.min(remaining, max - prev);
    commission += chunk * rate;
    remaining  -= chunk;
    prev        = max === Infinity ? prev : max;
  }
  return Math.round(commission);
}

function estimateTips(monthlyRev) {
  const dailyCount      = Math.min(6, Math.max(2, Math.round(monthlyRev / 22 / 130_000)));
  const bookingsPerMonth = Math.round(dailyCount * 22 * 0.9);
  const tipsCount       = Math.round(bookingsPerMonth * 0.40);
  return Math.round(tipsCount * 60_000);
}

function getSalaryStatus(year, month) {
  if (year === 2025)                return "Paid";
  if (year === 2026 && month <= 3)  return "Paid";
  if (year === 2026 && month === 4) return "Pending";
  return "Draft";
}

function getSentAt(year, month, status) {
  if (status === "Draft") return null;
  return new Date(year, month - 1, 28, 9, 0, 0);
}

function getDeadlineAt(sentAt) {
  if (!sentAt) return null;
  return new Date(sentAt.getTime() + 48 * 60 * 60 * 1000);
}

// ── Bonus profile — giảm số thợ đủ điều kiện lên cấp ───────────────────────
// Điều kiện lên cấp Junior→Senior: rev >= 30tr + >= 6 tháng + 3 tháng liên tiếp đạt
// Điều kiện lên cấp Senior→Master: rev >= 50tr + >= 12 tháng + 3 tháng liên tiếp đạt
//
// Chỉ 2 thợ ĐỦ điều kiện:
//   Barber 39: Junior, rev=35tr ✅, join 2025-01 (>6 tháng) ✅  → đủ lên Senior
//   Barber 47: Senior, rev=41tr < 50tr ❌                       → KHÔNG đủ lên Master
//   Barber 37: Senior, rev=42tr < 50tr ❌                       → KHÔNG đủ lên Master
//
// Vậy thực tế CHỈ 1 thợ đủ điều kiện: Barber 39 (Junior → Senior)
// Barber 36, 46, 56 là Master rồi → không lên được nữa
//
// Bonus KPI vẫn giữ (khác với điều kiện lên cấp):

const BARBER_BONUS_PROFILE = {
  // Master — không lên cấp được
  36: { bonus: 1_500_000 },
  46: { bonus: 1_500_000 },
  56: { bonus: 1_500_000 },
  // Senior — rev < 50tr → không đủ lên Master
  37: { bonus: 1_000_000 },
  47: { bonus: 1_000_000 },
  57: { bonus: 1_000_000 },
  38: { bonus: 1_500_000 },
  48: { bonus: 1_500_000 },
  58: { bonus: 1_500_000 },
  66: { bonus: 1_000_000 },
  // Junior active — chỉ barber 39 đủ điều kiện lên cấp
  39: { bonus: 500_000  }, // ← ĐỦ điều kiện Junior→Senior
  40: { bonus: 500_000  }, // join 2025-01 nhưng rev=33tr, cần thêm 3 tháng liên tiếp
  41: { bonus: 500_000  }, // join 2025-02
  42: { bonus: 500_000  }, // join 2025-03
  49: { bonus: 500_000  },
  50: { bonus: 500_000  },
  51: { bonus: 500_000  },
  52: { bonus: 500_000  },
  59: { bonus: 500_000  },
  60: { bonus: 500_000  },
  61: { bonus: 500_000  },
  62: { bonus: 500_000  },
  67: { bonus: 500_000  },
  68: { bonus: 500_000  },
  69: { bonus: 500_000  },
  70: { bonus: 500_000  },
  71: { bonus: 500_000  },
  72: { bonus: 500_000  },
  // Junior low rev — không đủ điều kiện
  43: { bonus: 0 },
  53: { bonus: 0 },
  63: { bonus: 0 },
  73: { bonus: 0 },
  // Junior chưa đủ tháng
  44: { bonus: 500_000 },
  54: { bonus: 500_000 },
  64: { bonus: 500_000 },
  74: { bonus: 500_000 },
  // Junior newest
  45: { bonus: 0 },
  55: { bonus: 0 },
  65: { bonus: 0 },
  75: { bonus: 0 },
};

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
  { idBarber: 67, branch: 4, monthlyRev: 30_000_000, startKey: "2025-01-01" },
  { idBarber: 68, branch: 4, monthlyRev: 28_000_000, startKey: "2025-02-01" },
  { idBarber: 69, branch: 4, monthlyRev: 27_000_000, startKey: "2025-02-01" },
  { idBarber: 70, branch: 4, monthlyRev: 26_000_000, startKey: "2025-03-01" },
  { idBarber: 71, branch: 4, monthlyRev: 25_000_000, startKey: "2025-03-01" },
  { idBarber: 72, branch: 4, monthlyRev: 24_000_000, startKey: "2025-04-01" },
  { idBarber: 73, branch: 4, monthlyRev: 10_000_000, startKey: "2025-01-01" },
  { idBarber: 74, branch: 4, monthlyRev: 18_000_000, startKey: "2025-10-01" },
  { idBarber: 75, branch: 4, monthlyRev: 15_000_000, startKey: "2025-05-01" },
];

const BRANCH4_LAST_MONTH = { year: 2026, month: 3 };

export async function up(queryInterface) {
  await queryInterface.bulkDelete("salaries", null, {});

  // ── 1. Query contracts từ DB ──────────────────────────────────────────────
  const dbContracts = await queryInterface.sequelize.query(
    `SELECT idContract, idBarber, idPlan, actualBaseSalary, startDate, endDate
     FROM salary_contracts`,
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  );

  // ── 2. Query tất cả barber_day_offs ──────────────────────────────────────
  const allDayOffs = await queryInterface.sequelize.query(
    `SELECT idUnavailable, idBarber, startDate, endDate
     FROM barber_day_offs`,
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  );

  console.log(`   Loaded ${dbContracts.length} contracts, ${allDayOffs.length} day_offs`);

  function getContractForMonth(idBarber, year, month) {
    const barberContracts = dbContracts.filter((c) => Number(c.idBarber) === Number(idBarber));
    const targetDate      = new Date(year, month - 1, 1);

    for (const c of barberContracts) {
      const from          = new Date(c.startDate);
      const fromMonthStart = new Date(from.getFullYear(), from.getMonth(), 1);
      let toMonthEnd      = null;
      if (c.endDate) {
        const to  = new Date(c.endDate);
        toMonthEnd = new Date(to.getFullYear(), to.getMonth(), 1);
      }
      if (targetDate >= fromMonthStart && (!toMonthEnd || targetDate <= toMonthEnd)) {
        const planId   = Number(c.idPlan);
        const planType = planId === 2 ? "senior" : planId === 3 ? "master" : planId === 4 ? "junior2024" : "junior";
        return {
          planType,
          contractId: Number(c.idContract),
          baseSalary: Number(c.actualBaseSalary),
        };
      }
    }
    return null;
  }

  // ── 3. Build salary records ───────────────────────────────────────────────
  const salaries = [];
  const periods  = [];
  for (let m = 1; m <= 12; m++) periods.push({ year: 2025, month: m });
  for (let m = 1; m <=  4; m++) periods.push({ year: 2026, month: m });

  for (const cfg of BARBER_CONFIGS) {
    const startDate    = new Date(cfg.startKey);
    const bonusProfile = BARBER_BONUS_PROFILE[cfg.idBarber];

    for (const { year, month } of periods) {
      const periodStart = new Date(year, month - 1, 1);

      // Branch 4 cutoff
      if (cfg.branch === 4) {
        if (year > BRANCH4_LAST_MONTH.year) continue;
        if (year === BRANCH4_LAST_MONTH.year && month > BRANCH4_LAST_MONTH.month) continue;
      }

      // Barber chưa join
      const joinMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      if (periodStart < joinMonth) continue;

      const contract = getContractForMonth(cfg.idBarber, year, month);
      if (!contract) continue;

      const { planType, contractId, baseSalary } = contract;

      // ── Tính ngày nghỉ trong tháng ────────────────────────────────────
      const totalDays  = daysInMonthFn(year, month);
      const daysOff    = countDaysOffInMonth(allDayOffs, cfg.idBarber, year, month);
      const daysWorked = totalDays - daysOff;

      // ── Tính lương cứng theo ngày thực làm ────────────────────────────
      const baseSalaryActual = daysOff > 0
        ? Math.round((baseSalary / totalDays) * daysWorked)
        : baseSalary;

      // ── Commission tính trên doanh thu thực (tỉ lệ ngày làm) ─────────
      const revenueActual = daysOff > 0
        ? Math.round((cfg.monthlyRev / totalDays) * daysWorked)
        : cfg.monthlyRev;

      const commission = calcCommission(revenueActual, planType);
      const tips       = estimateTips(revenueActual);
      const bonus      = bonusProfile?.bonus ?? 0;
      const deductions = 0;

      const totalSalary = baseSalaryActual + commission + tips + bonus;
      const netSalary   = totalSalary - deductions;

      const status     = getSalaryStatus(year, month);
      const sentAt     = getSentAt(year, month, status);
      const deadlineAt = getDeadlineAt(sentAt);
      const paidAmount = status === "Paid" ? netSalary : null;

      salaries.push({
        idBarber:        cfg.idBarber,
        idContract:      contractId,
        calculationType: "MONTHLY",
        daysWorked:      daysWorked,
        month,
        year,
        serviceRevenue:  revenueActual,
        baseSalary:      baseSalaryActual,
        commission,
        tips,
        bonus,
        totalSalary,
        deductions,
        netSalary,
        status,
        disputeReason:   null,
        disputeCount:    0,
        sentAt,
        deadlineAt,
        paidAmount,
        paymentProofUrl: status === "Paid"
          ? `https://proof.barber.com/salary/${cfg.idBarber}_${year}_${month}.jpg`
          : null,
        createdAt: new Date(year, month - 1, 28),
        updatedAt: new Date(year, month - 1, 28),
      });
    }
  }

  // ── 4. Insert ─────────────────────────────────────────────────────────────
  const CHUNK = 200;
  for (let i = 0; i < salaries.length; i += CHUNK) {
    await queryInterface.bulkInsert("salaries", salaries.slice(i, i + CHUNK));
  }

  // ── 5. Summary ───────────────────────────────────────────────────────────
  const byStatus = salaries.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  const withDayOff = salaries.filter((s) => s.daysWorked < daysInMonthFn(s.year, s.month));

  console.log(`✅ [10] Inserted ${salaries.length} salary records`);
  console.log("   Status breakdown:", JSON.stringify(byStatus));
  console.log(`   Records có ngày nghỉ: ${withDayOff.length}`);
  withDayOff.forEach((s) => {
    const total = daysInMonthFn(s.year, s.month);
    console.log(
      `   → Barber ${s.idBarber} | ${s.year}/${String(s.month).padStart(2,"0")}` +
      ` | daysWorked=${s.daysWorked}/${total}` +
      ` | baseSalary=${s.baseSalary.toLocaleString()}đ` +
      ` | net=${s.netSalary.toLocaleString()}đ`
    );
  });
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("salaries", null, {});
  console.log("↩️  [10] Rolled back salaries");
}