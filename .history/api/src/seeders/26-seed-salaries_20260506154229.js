"use strict";

export async function up(queryInterface) {
  const salaries = [];
  const months = [1, 2, 3]; // Xét duyệt dựa trên Quý 1/2026

  const barberConfigs = [
    { idBarber: 15, idContract: 1, rev: 36000000, base: 3000000, plan: 'junior' },
    { idBarber: 17, idContract: 2, rev: 36000000, base: 3000000, plan: 'junior' },
    { idBarber: 19, idContract: 3, rev: 15000000, base: 3000000, plan: 'junior' },
    { idBarber: 16, idContract: 4, rev: 54000000, base: 4500000, plan: 'senior' },
  ];

  // Hàm tính hoa hồng nhanh theo Rules bạn đã cung cấp
  const calcComm = (rev, plan) => {
    if (plan === 'junior') {
      if (rev <= 20000000) return rev * 0.08;
      if (rev <= 40000000) return rev * 0.10;
      return rev * 0.12;
    }
    if (plan === 'senior') {
      if (rev <= 20000000) return rev * 0.10;
      if (rev <= 40000000) return rev * 0.12;
      return rev * 0.14;
    }
    return 0;
  };

  months.forEach((m) => {
    barberConfigs.forEach((c) => {
      const commission = calcComm(c.rev, c.plan);
      const tips = 600000; // Giả lập tiền tip từ booking_tips
      const total = c.base + commission + tips;

      salaries.push({
        idBarber: c.idBarber,
        idContract: c.idContract,
        month: m,
        year: 2026,
        calculationType: "MONTHLY",
        serviceRevenue: c.rev, 
        baseSalary: c.base,
        commission: commission,
        tips: tips,
        bonus: 0,
        totalSalary: total,
        deductions: 0,
        netSalary: total,
        status: "Paid",
        paidAmount: total,
        createdAt: new Date(`2026-${m}-28`),
        updatedAt: new Date(`2026-${m}-28`),
      });
    });
  });

  await queryInterface.bulkInsert("salaries", salaries, { ignoreDuplicates: true });
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("salaries", null, {});
}