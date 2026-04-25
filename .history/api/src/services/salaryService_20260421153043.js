import db from "../models/index.js";
import { fn, col, Op } from "sequelize";
import { createNotification } from "./notificationService.js";

// ====================== 1. Lấy lương real-time (Tính toán gốc) ======================
export const getBarberSalariesOptimized = async (month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const salaries = await db.Barber.findAll({
    include: [
      { model: db.User, as: "user", attributes: ["idUser", "fullName"], required: true },
      { model: db.Branch, as: "branch", attributes: ["name", "address"], required: false },
      {
        model: db.Booking,
        as: "Bookings",
        required: false,
        where: { isPaid: true, bookingDate: { [Op.gte]: startDate, [Op.lt]: endDate } },
        include: [
          { model: db.BookingDetail, as: "BookingDetails", attributes: [] },
          { model: db.BookingTip, as: "BookingTip", attributes: [] },
        ],
        attributes: [],
      },
    ],
    attributes: [
      "idBarber",
      [fn("COALESCE", fn("SUM", col("Bookings.BookingDetails.price")), 0), "serviceRevenue"],
      [fn("COALESCE", fn("SUM", col("Bookings.BookingTip.tipAmount")), 0), "tipAmount"],
      [col("user.fullName"), "barberName"],
      [col("user.idUser"), "idUser"],
      [col("branch.name"), "branchName"],
    ],
    group: ["Barber.idBarber", "user.idUser", "branch.idBranch"],
  });

  const bonusRules = await db.BonusRule.findAll({ where: { active: true }, order: [["minRevenue", "ASC"]] });

  return salaries.map((b) => {
    const serviceRevenue = parseFloat(b.get("serviceRevenue") || 0);
    const tipAmount = parseFloat(b.get("tipAmount") || 0);
    const baseSalary = 3000000;
    const commission = serviceRevenue * 0.15;

    const rule = bonusRules.find(
      (r) => serviceRevenue >= parseFloat(r.minRevenue) && (r.maxRevenue == null || serviceRevenue <= parseFloat(r.maxRevenue))
    );
    const bonus = rule ? (commission * parseFloat(rule.bonusPercent)) / 100 : 0;
    const totalSalary = baseSalary + commission + tipAmount + bonus;

    return {
      idBarber: b.idBarber,
      idUser: b.get("idUser"),
      barberName: b.get("barberName"),
      branchName: b.get("branchName") || "",
      serviceRevenue,
      tip: tipAmount,
      baseSalary,
      commission,
      bonus,
      totalSalary,
    };
  });
};

// ====================== 2. API Lấy dữ liệu hiển thị Frontend ======================
export const getSalaryOverview = async () => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const months = [];

  for (let month = 1; month <= 12; month++) { // Lấy nguyên năm cho UI dễ lọc
    let mappedSalaries = [];
    
    // Lấy dữ liệu đã lưu trữ trong DB kèm chi tiết Khấu trừ
    const savedSalaries = await db.Salary.findAll({
      where: { month, year: currentYear },
      include: [
        {
          model: db.Barber, as: "barber",
          include: [
            { model: db.User, as: "user", attributes: ["fullName"] },
            { model: db.Branch, as: "branch", attributes: ["name"] },
          ],
        },
        { model: db.SalaryDeduction, as: "DeductionsList" }
      ],
    });

    if (savedSalaries.length > 0) {
      mappedSalaries = savedSalaries.map(s => {
        // Tách tổng Tạm ứng và Phạt từ bảng Deductions để Frontend hiện
        const advance = s.DeductionsList.filter(d => d.type === "Tạm ứng").reduce((sum, d) => sum + parseFloat(d.amount), 0);
        const deduction = s.DeductionsList.filter(d => d.type !== "Tạm ứng").reduce((sum, d) => sum + parseFloat(d.amount), 0);

        return {
          idSalary: s.idSalary,
          idBarber: s.idBarber,
          barberName: s.barber?.user?.fullName || "",
          branchName: s.barber?.branch?.name || "",
          baseSalary: parseFloat(s.baseSalary),
          commission: parseFloat(s.commission),
          tip: parseFloat(s.tips),
          bonus: parseFloat(s.bonus),
          serviceRevenue: 0, // Bỏ qua nếu ko cần, hoặc lưu thêm vào DB nếu cần
          advance,
          deduction,
          adjustmentNote: s.adjustmentNote,
          status: s.status,
          disputeCount: s.disputeCount,
          disputeReason: s.disputeReason,
          deadlineAt: s.deadlineAt,
          paidAmount: s.paidAmount
        };
      });
    }

    months.push({
      month,
      year: currentYear,
      salaries: mappedSalaries,
    });
  }

  return months;
};

// ====================== 3. Tính lương & Lưu Nháp (Draft) ======================
export const createDraftSalaries = async (month, year) => {
  const today = new Date();
  if (year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth() + 1)) {
    throw new Error("Chưa hết tháng, không thể chốt bảng lương!");
  }

  const salaries = await getBarberSalariesOptimized(month, year);
  const transaction = await db.sequelize.transaction();

  try {
    for (const s of salaries) {
      const existing = await db.Salary.findOne({ where: { idBarber: s.idBarber, month, year } });
      
      // Chỉ tạo mới hoặc cập nhật nếu đang ở Draft
      if (!existing || existing.status === "Draft") {
        const total = parseFloat(s.totalSalary);
        const deductions = existing ? parseFloat(existing.deductions) : 0;
        const net = total - deductions;

        if (existing) {
          await existing.update({
            baseSalary: s.baseSalary, commission: s.commission, tips: s.tip, 
            bonus: s.bonus, totalSalary: total, netSalary: net
          }, { transaction });
        } else {
          await db.Salary.create({
            idBarber: s.idBarber, month, year,
            baseSalary: s.baseSalary, commission: s.commission, tips: s.tip, 
            bonus: s.bonus, totalSalary: total, deductions: 0, netSalary: total,
            status: "Draft"
          }, { transaction });
        }
      }
    }
    await transaction.commit();
    return { success: true };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ====================== 4. Gửi Phiếu Lương (Pending) ======================
export const sendPayslip = async (idSalary) => {
  const salary = await db.Salary.findByPk(idSalary, {
    include: [{ model: db.Barber, as: "barber", include: [{ model: db.User, as: "user" }] }]
  });

  if (!salary) throw new Error("Không tìm thấy phiếu lương");
  
  const now = new Date();
  const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000); // +48 tiếng

  await salary.update({ status: "Pending", sentAt: now, deadlineAt: deadline });

  // Gửi Notification cho thợ
  if (salary.barber?.user?.idUser) {
    await createNotification({
      type: "SALARY",
      title: `Phiếu lương tháng ${salary.month}/${salary.year}`,
      content: `Quản lý đã gửi phiếu lương. Vui lòng xác nhận trong 48h tới.`,
      targetRole: "barber",
      targetId: salary.barber.user.idUser,
      referenceId: salary.idSalary
    });
  }

  return salary;
};

// ====================== 5. Điều chỉnh Khấu trừ (Lưu từ Modal) ======================
export const adjustSalary = async ({ idSalary, advance, deduction, adjustmentNote }) => {
  const transaction = await db.sequelize.transaction();
  try {
    const salary = await db.Salary.findByPk(idSalary, { transaction });
    if (!salary) throw new Error("Phiếu lương không tồn tại");

    // Xóa các khoản trừ cũ để thay bằng cái mới từ form
    await db.SalaryDeduction.destroy({ where: { idSalary }, transaction });

    let totalDeduct = 0;
    const deductionsToCreate = [];

    if (advance > 0) {
      deductionsToCreate.push({ idSalary, amount: advance, reason: "Tạm ứng", type: "Tạm ứng" });
      totalDeduct += advance;
    }
    if (deduction > 0) {
      deductionsToCreate.push({ idSalary, amount: deduction, reason: "Phạt / Khấu trừ", type: "Phạt" });
      totalDeduct += deduction;
    }

    if (deductionsToCreate.length > 0) {
      await db.SalaryDeduction.bulkCreate(deductionsToCreate, { transaction });
    }

    const net = parseFloat(salary.totalSalary) - totalDeduct;

    // Đưa về Draft để Admin gửi lại
    await salary.update({
      deductions: totalDeduct,
      netSalary: net,
      adjustmentNote: adjustmentNote,
      status: ["Draft", "Disputed"].includes(salary.status) ? "Draft" : salary.status
    }, { transaction });

    await transaction.commit();
    return salary;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// ====================== 6. Ép đóng Khiếu Nại (Force-close) ======================
export const forceCloseSalaryDispute = async (idSalary, reason) => {
  const salary = await db.Salary.findByPk(idSalary, {
    include: [{ model: db.Barber, as: "barber", include: [{ model: db.User, as: "user" }] }]
  });
  if (!salary || salary.status !== "Disputed") throw new Error("Không thể thao tác");

  await salary.update({ 
    status: "Confirmed", 
    adjustmentNote: `[Từ chối khiếu nại]: ${reason}` 
  });

  if (salary.barber?.user?.idUser) {
    await createNotification({
      type: "SALARY",
      title: "Khiếu nại lương đã bị đóng",
      content: `Quản lý: ${reason}. Phiếu lương đã được chốt.`,
      targetRole: "barber",
      targetId: salary.barber.user.idUser,
      referenceId: salary.idSalary
    });
  }

  return salary;
};

// ====================== 7. Thanh toán & Khóa Sổ ======================
export const markAsPaid = async (idSalary, { paidAmount, paymentProofUrl }) => {
  const salary = await db.Salary.findByPk(idSalary);
  
  if (!["Confirmed", "AutoConfirmed"].includes(salary.status)) {
    throw new Error("Chỉ được thanh toán phiếu lương đã xác nhận");
  }

  await salary.update({
    paidAmount,
    paymentProofUrl,
    status: "Paid" // Chốt sổ
  });

  return salary;
};
// ====================== DÀNH CHO THỢ CẮT TÓC (BARBER) ======================

// 1. Lấy danh sách phiếu lương của 1 thợ (Bỏ qua bản Nháp)
// ====================== DÀNH CHO THỢ CẮT TÓC (BARBER) ======================

// 1. Lấy danh sách phiếu lương của 1 thợ (Bỏ qua bản Nháp)
export const getMyPayslips = async (idUser) => {
  // Thay vì tìm idUser, chúng ta dùng idUser truyền vào 
  // chính là idBarber (theo thiết kế foreignKey: "idBarber" của ông)
  
  const payslips = await db.Salary.findAll({
    where: {
      idBarber: idUser, // Ở đây dùng idUser của thợ đang login làm idBarber để tìm
      status: { [Op.ne]: "Draft" }
    },
    include: [
      {
        model: db.SalaryDeduction,
        as: "DeductionsList",
        required: false
      }
    ],
    order: [
      ["year", "DESC"],
      ["month", "DESC"]
    ]
  });

  return payslips;
};

// 2. Thợ xác nhận phiếu lương (Pending -> Confirmed)
export const confirmPayslipByBarber = async (idSalary, idUser) => {
  const salary = await db.Salary.findByPk(idSalary, {
    include: [{ model: db.Barber, as: "barber" }]
  });

  if (!salary) throw new Error("Không tìm thấy phiếu lương.");
  if (salary.barber.idUser !== parseInt(idUser)) throw new Error("Bạn không có quyền thao tác.");
  if (salary.status !== "Pending") throw new Error("Chỉ có thể xác nhận phiếu ở trạng thái Pending.");

  await salary.update({ status: "Confirmed" });

  // Thông báo cho Admin (TargetId có thể để null hoặc ID Admin cụ thể tùy logic của ông)
  await createNotification({
    type: "SALARY",
    title: "Thợ đã xác nhận lương",
    content: `Thợ đã đồng ý với phiếu lương tháng ${salary.month}/${salary.year}.`,
    targetRole: "admin"
  });

  return salary;
};

// 3. Thợ gửi khiếu nại (Pending -> Disputed)
export const disputePayslipByBarber = async (idSalary, idUser, reason) => {
  const salary = await db.Salary.findByPk(idSalary, {
    include: [{ model: db.Barber, as: "barber" }]
  });

  if (!salary) throw new Error("Không tìm thấy phiếu lương.");
  if (parseInt(salary.barber.idBarber) !== parseInt(idUser)) throw new Error("Bạn không có quyền thao tác.");
  if (salary.status !== "Pending") throw new Error("Chỉ có thể khiếu nại khi phiếu đang ở trạng thái Pending.");

  await salary.update({
    status: "Disputed",
    disputeReason: reason,
    disputeCount: (salary.disputeCount || 0) + 1
  });

  await createNotification({
    type: "SALARY",
    title: "Khiếu nại lương mới",
    content: `Thợ khiếu nại lương tháng ${salary.month}: ${reason}`,
    targetRole: "admin"
  });

  return salary;
};