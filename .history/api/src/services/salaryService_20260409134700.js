import db from "../models/index.js";
import { fn, col, Op } from "sequelize";
import { createNotification } from "./notificationService.js";

// ====================== Lấy lương real-time cho một tháng ======================
export const getBarberSalariesOptimized = async (month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const salaries = await db.Barber.findAll({
    include: [
      { model: db.User, as: "user", attributes: ["fullName"], required: true },
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
      [col("branch.name"), "branchName"],
      [col("branch.address"), "branchAddress"],
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
      barberName: b.get("barberName"),
      branchName: b.get("branchName") || "",
      branchAddress: b.get("branchAddress") || "",
      serviceRevenue: serviceRevenue.toFixed(0),
      tip: tipAmount.toFixed(0),
      baseSalary: baseSalary.toFixed(0),
      commission: commission.toFixed(0),
      bonus: bonus.toFixed(0),
      totalSalary: totalSalary.toFixed(0),
      status: "Chưa tính",
    };
  });
};

// ====================== Lấy danh sách tháng + trạng thái lương ======================
// ====================== Lấy danh sách tháng + trạng thái lương ======================
export const getSalaryOverview = async () => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const months = [];

  for (let month = 1; month <= currentMonth; month++) {
    let salaries = [];
    let canCalculate = false;

    // Lấy dữ liệu đã lưu từ DB
    const savedSalaries = await db.Salary.findAll({
      where: { month, year: currentYear },
      include: [
        {
          model: db.Barber,
          as: "barber",
          attributes: ["idBarber"],
          include: [
            { model: db.User, as: "user", attributes: ["fullName"] },
            { model: db.Branch, as: "branch", attributes: ["name"] },
          ],
        },
      ],
    });

    if (month === currentMonth) {
      // Tháng hiện tại → real-time, không được tính
      salaries = (await getBarberSalariesOptimized(month, currentYear)).map((s) => ({
        ...s,
        status: "Chưa tính",
      }));
      canCalculate = false;
    } else if (savedSalaries.length > 0) {
      // Tháng trước đã lưu
      salaries = savedSalaries.map((s) => ({
        idBarber: s.barber.idBarber,
        barberName: s.barber?.user?.fullName || "",
        branchName: s.barber?.branch?.name || "",
        baseSalary: s.baseSalary || 0,
        commission: s.commission || 0,
        tip: s.tips || 0,
        bonus: s.bonus || 0,
        totalSalary: s.totalSalary || 0,
        status: s.status ? "Đã tính" : "Chưa tính",
      }));
      // Nếu còn thợ chưa tính → bật nút tính lương
      canCalculate = savedSalaries.some((s) => !s.status);
    } else {
      // Tháng trước chưa lưu → lấy snapshot real-time, bật nút tính lương
      salaries = (await getBarberSalariesOptimized(month, currentYear)).map((s) => ({
        ...s,
        status: "Chưa tính",
      }));
      canCalculate = true;
    }

    months.push({
      month,
      year: currentYear,
      isCurrentMonth: month === currentMonth,
      canCalculate,
      salaries: Array.isArray(salaries) ? salaries : [],
    });
  }

  return months;
};

// ====================== Xác nhận tính lương toàn bộ thợ ======================
export const confirmMonthlySalary = async (month, year) => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Chặn tính lương tháng hiện tại hoặc tương lai
    if (year > currentYear || (year === currentYear && month >= currentMonth)) {
      return { success: false, message: "Không được tính lương tháng hiện tại hoặc tương lai" };
    }

    // Lấy dữ liệu real-time để tính chính xác
    const salaries = await getBarberSalariesOptimized(month, year);

    const salaryData = salaries.map((s) => ({
      idBarber: s.idBarber,
      month,
      year,
      baseSalary: parseFloat(s.baseSalary),
      commission: parseFloat(s.commission),
      tips: parseFloat(s.tip),
      bonus: parseFloat(s.bonus),
      totalSalary: parseFloat(s.totalSalary),
      status: true, // đã tính
    }));

    await db.Salary.bulkCreate(salaryData, {
      updateOnDuplicate: ["baseSalary", "commission", "tips", "bonus", "totalSalary", "status"],
    });

    for (const salary of salaries) {
      const barberId = salary.idBarber;
      const total = parseFloat(salary.totalSalary).toLocaleString("vi-VN");

      // Lấy userId của barber để gửi thông báo đúng người
      const barber = await db.Barber.findByPk(barberId, {
        include: [{ model: db.User, as: "user", attributes: ["idUser"] }],
      });

      if (barber?.user?.idUser) {
        await createNotification({
          type: "SALARY",
          title: `Lương tháng ${month}/${year}`,
          content: `Lương tháng ${month}/${year} của bạn là ${total} VNĐ. Chi tiết xem trong mục lương.`,
          targetRole: "barber",
          targetId: barber.user.idUser,
        });
      }
    }

    return { success: true, message: "Đã tính lương và gửi thông báo thành công!" };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Tính lương thất bại" };
  }
};
