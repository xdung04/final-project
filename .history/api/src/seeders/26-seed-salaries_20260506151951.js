"use strict";
import moment from "moment";

export async function up(queryInterface) {
  const salaries = [];

  // Lấy 3 tháng gần nhất để hệ thống xét duyệt (Vd: Hiện tại là Tháng 5 -> Sẽ lấy Tháng 2, 3, 4)
  const evaluateMonths = [
    moment().subtract(3, "months"),
    moment().subtract(2, "months"),
    moment().subtract(1, "months"),
  ];

  // ── MAPPING DỮ LIỆU ĐỂ TEST LÊN CẤP ─────────────────────────────────────
  // B15 (Junior): Đủ thâm niên 8 tháng + Doanh thu 36tr (Pass lên Senior)
  // B17 (Junior): Thiếu thâm niên (4 tháng) + Doanh thu 36tr (Fail lên cấp)
  // B19 (Junior): Đủ thâm niên 8 tháng + Doanh thu 15tr (Fail lên cấp)
  // B16 (Senior): Đủ thâm niên 14 tháng + Doanh thu 54tr (Pass lên Master)
  
  const mockPayrollData = [
    { 
      idBarber: 15, idContract: 1, 
      serviceRevenue: 36000000, baseSalary: 3000000, 
      commission: 3200000, bonus: 500000 
    },
    { 
      idBarber: 17, idContract: 2, 
      serviceRevenue: 36000000, baseSalary: 3000000, 
      commission: 3200000, bonus: 500000 
    },
    { 
      idBarber: 19, idContract: 3, 
      serviceRevenue: 15000000, baseSalary: 3000000, 
      commission: 1200000, bonus: 0 
    },
    { 
      idBarber: 16, idContract: 4, 
      serviceRevenue: 54000000, baseSalary: 4500000, 
      commission: 6360000, bonus: 1000000 
    },
  ];

  evaluateMonths.forEach((monthMoment) => {
    const salaryMonth = monthMoment.month() + 1; // month() trong moment tính từ 0-11
    const salaryYear = monthMoment.year();
    
    // Giả lập ngày trả lương: mùng 5 của tháng tiếp theo
    const paymentDate = monthMoment.clone().add(1, "months").date(5).toDate();

    mockPayrollData.forEach((data) => {
      // Tính toán tổng thu và thực nhận
      const totalSalary = data.baseSalary + data.commission + data.bonus;
      const deductions = 0; // Giả sử không có phạt
      const netSalary = totalSalary - deductions;

      salaries.push({
        idBarber: data.idBarber,
        idContract: data.idContract,
        calculationType: "MONTHLY",
        daysWorked: 26, // Giả sử làm full tháng
        month: salaryMonth,
        year: salaryYear,
        
        // Cực kỳ quan trọng: API xét lên cấp sẽ nhìn vào field này
        serviceRevenue: data.serviceRevenue,
        
        // Chi tiết tiền
        baseSalary: data.baseSalary,
        commission: data.commission,
        tips: 0,
        bonus: data.bonus,
        totalSalary: totalSalary,
        deductions: deductions,
        netSalary: netSalary,
        
        // Trạng thái đã chốt sổ và thanh toán
        status: "Paid", 
        paidAmount: netSalary, // Đã trả đủ tiền
        paymentProofUrl: "https://example.com/mock-receipt.jpg",
        
        // Tracking 48h (Giả lập đã gửi và chốt trước deadline)
        sentAt: monthMoment.clone().add(1, "months").date(1).toDate(),
        deadlineAt: monthMoment.clone().add(1, "months").date(3).toDate(),
        
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  });

  await queryInterface.bulkInsert("salaries", salaries, { ignoreDuplicates: true });
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("salaries", null, {});
}