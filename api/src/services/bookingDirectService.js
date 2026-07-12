import db from "../models/index.js";
import { Op, Sequelize } from "sequelize";
import { sendBookingEmail } from "./mailService.js";

/**
 * Service: Tìm khách hàng theo số điện thoại
 */
export const findCustomerByPhoneService = async (phone) => {
  const user = await db.User.findOne({
    where: { phoneNumber: phone },
    include: [
      {
        model: db.Customer,
        as: "customer",
      },
    ],
  });

  if (!user) {
    return {
      exists: false,
      name: "Khách vãng lai",
      idCustomer: 0,
    };
  }

  // Nếu tồn tại user có vai trò customer
  if (user.role === "customer") {
    return {
      exists: true,
      name: user.fullName,
      idCustomer: user.customer ? user.customer.idCustomer : 0,
    };
  }

  // Nếu có user nhưng không phải khách hàng
  return {
    exists: false,
    name: "Khách vãng lai",
    idCustomer: 0,
  };
};

/**
 * Service: Đặt lịch trực tiếp (lễ tân tạo)
 */
export const createBookingDirectService = async ({
  idCustomer = 0,
  idBranch,
  idBarber,
  bookingDate,
  bookingTime,
  services,
  description,
  customerName,
  phoneNumber,
}) => {
  if (!idBranch || !idBarber || !bookingDate || !bookingTime || !services?.length) {
    throw new Error("Thiếu thông tin bắt buộc để đặt lịch!");
  }

  // Lấy thông tin chi nhánh (thêm suspendDate + resumeDate)
  const branch = await db.Branch.findByPk(idBranch, {
    attributes: ["name", "address", "suspendDate", "resumeDate"],
  });

  if (!branch) {
    throw new Error("Không tìm thấy chi nhánh!");
  }

  const { suspendDate, resumeDate } = branch;
  const bookingDay = new Date(bookingDate).toISOString().split("T")[0];

  const formatDDMMYYYY = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("vi-VN");
  };

  // Kiểm tra chi nhánh đang tạm ngưng
  const isSuspendedNow =
    suspendDate &&
    bookingDay >= new Date(suspendDate).toISOString().split("T")[0] &&
    (!resumeDate || bookingDay < new Date(resumeDate).toISOString().split("T")[0]);

  if (isSuspendedNow) {
    throw new Error(
      `Chi nhánh tạm ngưng từ ${formatDDMMYYYY(suspendDate)} đến ${
        resumeDate ? formatDDMMYYYY(resumeDate) : "chưa xác định"
      } — không thể đặt vào thời gian này.`,
    );
  }

  // Kiểm tra trước ngày hoạt động trở lại
  if (resumeDate && bookingDay < new Date(resumeDate).toISOString().split("T")[0]) {
    throw new Error(
      `Chi nhánh sẽ hoạt động lại từ ${formatDDMMYYYY(resumeDate)} — vui lòng chọn ngày sau thời điểm này.`,
    );
  }

  // Lấy thông tin barber
  const barber = await db.Barber.findByPk(idBarber, {
    include: [{ model: db.User, as: "user", attributes: ["fullName", "email"] }],
  });

  if (!barber) {
    throw new Error("Không tìm thấy barber!");
  }

  // ====== KIỂM TRA BARBER ======
  // Kiểm tra lockDate — nếu ngày đặt >= lockDate thì barber không làm việc nữa
  if (barber.lockDate) {
    const lockDay = new Date(barber.lockDate);
    lockDay.setHours(0, 0, 0, 0);
    const selectedDay = new Date(bookingDate);
    selectedDay.setHours(0, 0, 0, 0);

    if (selectedDay >= lockDay) {
      throw new Error(
        `Thợ này sẽ nghỉ từ ngày ${new Date(barber.lockDate).toLocaleDateString("vi-VN")}. Vui lòng chọn ngày trước đó hoặc chọn thợ khác.`,
      );
    }
  }

  // Kiểm tra barber có bị khóa không
  if (barber.isLocked) {
    throw new Error("Tài khoản thợ đã bị khóa, không thể đặt lịch.");
  }

  // ====== KIỂM TRA LỊCH NGHỈ BARBER ======
  const dayOff = await db.BarberDayOff.findOne({
    where: {
      idBarber,
      startDate: { [Op.lte]: bookingDay },
      endDate: { [Op.gte]: bookingDay },
    },
  });

  if (dayOff) {
    throw new Error(
      `Thợ đã được xếp lịch nghỉ từ ${formatDDMMYYYY(dayOff.startDate)} đến ${formatDDMMYYYY(dayOff.endDate)}${dayOff.reason ? ` (lý do: ${dayOff.reason})` : ""}. Vui lòng chọn ngày khác hoặc chọn thợ khác.`,
    );
  }

  // ====== KIỂM TRA DỊCH VỤ ======
  const serviceIds = services.map((s) => s.idService);
  const foundServices = await db.Service.findAll({
    where: { idService: { [Op.in]: serviceIds } },
    attributes: ["idService", "name", "price", "status"],
  });

  for (const s of services) {
    const match = foundServices.find((fs) => fs.idService === s.idService);
    if (!match) {
      throw new Error(`Dịch vụ ID ${s.idService} không tồn tại.`);
    }
    if (match.status !== "Active") {
      throw new Error(`Dịch vụ "${match.name}" hiện không khả dụng. Vui lòng chọn dịch vụ khác.`);
    }
    // Kiểm tra giá từ frontend có khớp với giá trong DB không
    const dbPrice = parseFloat(match.price);
    const sentPrice = parseFloat(s.price);
    if (sentPrice !== dbPrice) {
      throw new Error(
        `Giá dịch vụ "${match.name}" đã thay đổi từ ${sentPrice.toLocaleString("vi-VN")}₫ thành ${dbPrice.toLocaleString("vi-VN")}₫. Vui lòng tải lại trang để cập nhật giá mới.`,
      );
    }
  }

  // Tính tổng tiền
  const total = services.reduce((sum, s) => sum + s.price * (s.quantity || 1), 0);

  // [FIX] Tạo slotKey để chống double-booking
  const slotKey = `${idBarber}_${bookingDay}_${bookingTime}`;

  // Dùng transaction để kiểm tra + tạo booking nguyên tử
  const booking = await db.sequelize.transaction(async (transaction) => {
    // Kiểm tra slot đã có booking chưa (không tính Cancelled)
    const existing = await db.Booking.findOne({
      where: {
        slotKey,
        status: { [Sequelize.Op.not]: "Cancelled" },
      },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (existing) {
      throw new Error("Khung giờ này đã có người đặt, vui lòng chọn khung giờ khác.");
    }

    // Tạo booking với slotKey
    return await db.Booking.create({
      idCustomer,
      idBranch,
      idBarber,
      bookingDate,
      bookingTime,
      slotKey,
      status: "Pending",
      description: description || null,
      total,
    }, { transaction });
  });

  // Thêm chi tiết dịch vụ
  for (const s of services) {
    await db.BookingDetail.create({
      idBooking: booking.idBooking,
      idService: s.idService,
      quantity: s.quantity || 1,
      price: s.price,
    });
  }

  // Gửi mail xác nhận nếu có idCustomer
  if (idCustomer && idCustomer !== 0) {
    const customer = await db.Customer.findByPk(idCustomer, {
      include: [{ model: db.User, as: "user", attributes: ["email", "fullName"] }],
    });

    if (customer?.user?.email) {
      await sendBookingEmail(customer.user.email, {
        branch: branch?.name || "Tên chi nhánh",
        branchAddress: branch?.address || "",
        barber: barber?.user?.fullName || "Tên barber",
        bookingDate,
        bookingTime,
        services,
        total,
      });
    }
  }

  return booking;
};