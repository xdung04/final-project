"use strict";

export async function up(queryInterface) {
  const salaries = [];
  const testYear = 2026;
  const evaluateMonths = [1, 2, 3]; // Tháng 1, 2, 3 để tháng 4 xét duyệt

  // Mapping logic hoa hồng dựa trên testScenarios của bạn
  const config = [
    { idBarber: 15, idContract: 1, rev: 36000000, base: 3000000, commRate: 0.1 },  // Junior Pass (10% hoa hồng)
    { idBarber: 17, idContract: 2, rev: 36000000, base: 3000000, commRate: 0.1 },  // Junior Pass Doanh thu, Fail thâm niên
    { idBarber: 19, idContract: 3, rev: 15000000, base: 3000000, commRate: 0.08 }, // Junior Fail Doanh thu
    { idBarber: 16, idContract: 4, rev: 54000000, base: 4500000, commRate: 0.15 }, // Senior Pass lên Master (15% hoa hồng)
  ];

  evaluateMonths.forEach((m) => {
    config.forEach((c) => {
      const commission = c.rev * c.commRate;
      // Giả lập tiền Tip ngẫu nhiên khoảng 500k - 1tr dựa trên booking_tips bạn đã seed
      const tips = Math.floor(Math.random() * 500000) + 500000;
      const bonus = c.rev > 30000000 ? 500000 : 0; // Thưởng nóng nếu > 30tr
      
      const total = c.base + commission + tips + bonus;

      salaries.push({
        idBarber: c.idBarber,
        idContract: c.idContract,
        month: m,
        year: testYear,
        calculationType: "MONTHLY",
        
        // --- Doanh thu gốc (Căn cứ để Backend check thăng cấp) ---
        serviceRevenue: c.rev, 

        // --- Chi tiết thu nhập ---
        baseSalary: c.base,
        commission: commission,
        tips: tips,
        bonus: bonus,
        totalSalary: total,
        deductions: 0,
        netSalary: total,
        
        // --- Workflow ---
        status: "Paid", // Trạng thái đã chi trả để hệ thống tính là tháng hợp lệ
        paidAmount: total,
        paymentProofUrl: "https://example.com/receipt.jpg",
        
        createdAt: new Date(`2026-${m}-28`), // Cuối tháng
        updatedAt: new Date(`2026-${m}-28`),
      });
    });
  });

  await queryInterface.bulkInsert("salaries", salaries, { ignoreDuplicates: true });
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("salaries", null, {});
}