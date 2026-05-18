"use strict";

// ════════════════════════════════════════════════════════════════════════════
// FILE 09 — salaries (FIX CHUẨN TIMELINE: GIỮA THÁNG 5 KHÔNG CÓ DATA LƯƠNG)
// ════════════════════════════════════════════════════════════════════════════

function calcCommission(rev, planType) {
  const RATES = {
    junior:     [{ max: 20_000_000, rate: 0.08 }, { max: 40_000_000, rate: 0.10 }, { max: Infinity, rate: 0.12 }],
    senior:     [{ max: 20_000_000, rate: 0.10 }, { max: 40_000_000, rate: 0.12 }, { max: Infinity, rate: 0.14 }],
    master:     [{ max: 20_000_000, rate: 0.12 }, { max: 40_000_000, rate: 0.15 }, { max: Infinity, rate: 0.18 }],
    junior2024: [{ max: 20_000_000, rate: 0.07 }, { max: 40_000_000, rate: 0.09 }, { max: Infinity, rate: 0.11 }],
  };
  let commission = 0;
  let remaining  = rev;
  let prev       = 0;
  for (const { max, rate } of RATES[planType]) {
    if (remaining <= 0) break;
    const chunk = max === Infinity ? remaining : Math.min(remaining, max - prev);
    commission += chunk * rate;
    remaining  -= chunk;
    prev        = max === Infinity ? prev : max;
  }
  return Math.round(commission);
}

const BARBER_BONUS_PROFILE = {
  36: { customerCount: 170, avgRating: 4.85, bonus: 1_500_000 },
  46: { customerCount: 172, avgRating: 4.83, bonus: 1_500_000 },
  56: { customerCount: 168, avgRating: 4.87, bonus: 1_500_000 },
  37: { customerCount: 130, avgRating: 4.75, bonus: 1_000_000 },
  47: { customerCount: 132, avgRating: 4.78, bonus: 1_000_000 },
  57: { customerCount: 128, avgRating: 4.72, bonus: 1_000_000 },
  38: { customerCount: 155, avgRating: 4.82, bonus: 1_500_000 },
  48: { customerCount: 157, avgRating: 4.85, bonus: 1_500_000 },
  58: { customerCount: 153, avgRating: 4.80, bonus: 1_500_000 },
  66: { customerCount: 125, avgRating: 4.73, bonus: 1_000_000 },
  39: { customerCount: 100, avgRating: 4.60, bonus: 500_000 },
  40: { customerCount: 102, avgRating: 4.62, bonus: 500_000 },
  41: { customerCount:  98, avgRating: 4.58, bonus: 500_000 },
  42: { customerCount:  95, avgRating: 4.55, bonus: 500_000 },
  49: { customerCount: 105, avgRating: 4.65, bonus: 500_000 },
  50: { customerCount: 100, avgRating: 4.60, bonus: 500_000 },
  51: { customerCount:  96, avgRating: 4.57, bonus: 500_000 },
  52: { customerCount:  93, avgRating: 4.52, bonus: 500_000 },
  59: { customerCount: 101, avgRating: 4.61, bonus: 500_000 },
  60: { customerCount:  99, avgRating: 4.59, bonus: 500_000 },
  61: { customerCount:  97, avgRating: 4.56, bonus: 500_000 },
  62: { customerCount:  94, avgRating: 4.53, bonus: 500_000 },
  67: { customerCount:  92, avgRating: 4.55, bonus: 500_000 },
  68: { customerCount:  90, avgRating: 4.52, bonus: 500_000 },
  69: { customerCount:  88, avgRating: 4.50, bonus: 500_000 },
  70: { customerCount:  86, avgRating: 4.55, bonus: 500_000 },
  71: { customerCount:  84, avgRating: 4.52, bonus: 500_000 },
  72: { customerCount:  82, avgRating: 4.50, bonus: 500_000 },
  43: { customerCount: 75, avgRating: 4.20, bonus: 0 },
  53: { customerCount: 72, avgRating: 4.15, bonus: 0 },
  63: { customerCount: 70, avgRating: 4.10, bonus: 0 },
  73: { customerCount: 68, avgRating: 4.05, bonus: 0 },
  44: { customerCount: 85, avgRating: 4.55, bonus: 500_000 },
  54: { customerCount: 83, avgRating: 4.52, bonus: 500_000 },
  64: { customerCount: 81, avgRating: 4.50, bonus: 500_000 },
  74: { customerCount: 80, avgRating: 4.50, bonus: 500_000 },
  45: { customerCount: 70, avgRating: 4.50, bonus: 0 },
  55: { customerCount: 68, avgRating: 4.45, bonus: 0 },
  65: { customerCount: 66, avgRating: 4.40, bonus: 0 },
  75: { customerCount: 65, avgRating: 4.35, bonus: 0 },
};

function estimateTips(monthlyRev) {
  const dailyCount = Math.min(6, Math.max(2, Math.round(monthlyRev / 22 / 130_000)));
  const bookingsPerMonth = Math.round(dailyCount * 22 * 0.9);
  const tipsCount  = Math.round(bookingsPerMonth * 0.40);
  const avgTip     = 60_000;
  return Math.round(tipsCount * avgTip);
}

// FIX LOGIC TRẠNG THÁI: Theo đúng luồng vận hành thực tế
function getSalaryStatus(year, month) {
  if (year === 2025)                return "Paid";
  if (year === 2026 && month <= 3)  return "Paid";      // Admin đã chuyển khoản xong
  if (year === 2026 && month === 4) return "Pending";   // Tháng gần nhất: Admin đã tính (Draft), đang chờ thợ xác nhận
  return "Draft";
}

function getSentAt(year, month, status) {
  // Chỉ có trạng thái từ khi gửi cho thợ duyệt (Pending) trở đi mới có ngày gửi
  if (status === "Draft") return null;
  return new Date(year, month - 1, 28, 9, 0, 0);
}

function getDeadlineAt(sentAt) {
  if (!sentAt) return null;
  return new Date(sentAt.getTime() + 48 * 60 * 60 * 1000);
}

function getPaidAmount(status, netSalary) {
  if (status === "Paid") return netSalary;
  return null;
}

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

  // 1. ĐỌC DB ĐỂ LẤY ID THẬT CỦA CÁC HỢP ĐỒNG
  const dbContracts = await queryInterface.sequelize.query(
    `SELECT idContract, idBarber, idPlan, actualBaseSalary, startDate, endDate FROM salary_contracts`,
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  );

  function getContractForMonth(idBarber, year, month) {
    const barberContracts = dbContracts.filter(c => Number(c.idBarber) === Number(idBarber));
    const targetDate = new Date(year, month - 1, 1);

    for (const c of barberContracts) {
      const from = new Date(c.startDate);
      const fromMonthStart = new Date(from.getFullYear(), from.getMonth(), 1);

      let toMonthEnd = null;
      if (c.endDate) {
        const to = new Date(c.endDate);
        toMonthEnd = new Date(to.getFullYear(), to.getMonth(), 1);
      }

      const isAfterStart = targetDate >= fromMonthStart;
      const isBeforeEnd = !toMonthEnd || targetDate <= toMonthEnd;

      if (isAfterStart && isBeforeEnd) {
        let planType = 'junior';
        const planId = Number(c.idPlan);
        if (planId === 1) planType = 'junior';
        if (planId === 2) planType = 'senior';
        if (planId === 3) planType = 'master';
        if (planId === 4) planType = 'junior2024';

        return { 
          planType, 
          contractId: Number(c.idContract), 
          baseSalary: Number(c.actualBaseSalary) 
        };
      }
    }
    return null;
  }

  // CẬP NHẬT: Loại bỏ hoàn toàn tháng 5/2026 ra khỏi danh sách tạo dữ liệu seed
  const salaries = [];
  const periods = [];
  for (let m = 1; m <= 12; m++) periods.push({ year: 2025, month: m });
  for (let m = 1; m <=  4; m++) periods.push({ year: 2026, month: m }); // Chỉ chạy đến hết tháng 4

  for (const cfg of BARBER_CONFIGS) {
    const startDate   = new Date(cfg.startKey);
    const bonusProfile = BARBER_BONUS_PROFILE[cfg.idBarber];

    for (const { year, month } of periods) {
      const periodStart = new Date(year, month - 1, 1);

      if (cfg.branch === 4) {
        if (year > BRANCH4_LAST_MONTH.year) continue;
        if (year === BRANCH4_LAST_MONTH.year && month > BRANCH4_LAST_MONTH.month) continue;
      }

      const joinMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      if (periodStart < joinMonth) continue;

      const contract = getContractForMonth(cfg.idBarber, year, month);
      if (!contract) continue;

      const { planType, contractId, baseSalary } = contract;
      const serviceRevenue = cfg.monthlyRev;
      const commission     = calcCommission(serviceRevenue, planType);
      const tips           = estimateTips(serviceRevenue);
      const bonus          = bonusProfile?.bonus ?? 0;

      const deductions  = 0;
      const totalSalary = baseSalary + commission + tips + bonus;
      const netSalary   = totalSalary - deductions;

      const status     = getSalaryStatus(year, month);
      const sentAt     = getSentAt(year, month, status);
      const deadlineAt = getDeadlineAt(sentAt);
      const paidAmount = getPaidAmount(status, netSalary);

      salaries.push({
        idBarber:        cfg.idBarber,
        idContract:      contractId,
        calculationType: "MONTHLY",
        daysWorked:      null,
        month,
        year,
        serviceRevenue,
        baseSalary,
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
        paymentProofUrl: (status === "Paid") ? `https://proof.barber.com/salary/${cfg.idBarber}_${year}_${month}.jpg` : null,
        createdAt:       new Date(year, month - 1, 28),
        updatedAt:       new Date(year, month - 1, 28),
      });
    }
  }

  const CHUNK = 200;
  for (let i = 0; i < salaries.length; i += CHUNK) {
    await queryInterface.bulkInsert("salaries", salaries.slice(i, i + CHUNK));
  }

  const byStatus = salaries.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  console.log(`✅ [09] Inserted ${salaries.length} salary records`);
  console.log("   Status breakdown:", JSON.stringify(byStatus));
}

export async function down(queryInterface) {
  await queryInterface.sequelize.query("TRUNCATE TABLE salaries RESTART IDENTITY CASCADE;");
}