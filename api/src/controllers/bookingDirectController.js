import db from "../models/index.js";
import { sendBookingEmail } from "../services/mailService.js";

/**
 * Tìm khách hàng theo số điện thoại
 */
export const findCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ message: "Thiếu số điện thoại!" });
    }

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
      return res.status(200).json({
        exists: false,
        name: "Khách vãng lai",
        idCustomer: 0,
      });
    }

    // Nếu tồn tại user có vai trò customer
    if (user.role === "customer") {
      return res.status(200).json({
        exists: true,
        name: user.fullName,
        idCustomer: user.customer ? user.customer.idCustomer : 0,
      });
    }

    // Nếu có user nhưng không phải khách hàng
    return res.status(200).json({
      exists: false,
      name: "Khách vãng lai",
      idCustomer: 0,
    });
  } catch (error) {
    console.error("Error in findCustomerByPhone:", error);
    return res.status(500).json({ message: "Lỗi server!" });
  }
};

/**
 * API: Đặt lịch trực tiếp (không cần token)
 */
export const createBookingDirect = async (req, res) => {
  try {
    const {
      idCustomer = 0,
      idBranch,
      idBarber,
      bookingDate,
      bookingTime,
      services,
      description,
      customerName,
      phoneNumber,
    } = req.body;

    if (!idBranch || !idBarber || !bookingDate || !bookingTime || !services?.length) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc để đặt lịch!" });
    }

    // Lấy thông tin chi nhánh (thêm suspendDate + resumeDate)
    const branch = await db.Branch.findByPk(idBranch, {
      attributes: ["name", "address", "suspendDate", "resumeDate"],
    });

    if (!branch) {
      return res.status(404).json({ message: "Không tìm thấy chi nhánh!" });
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
      return res.status(400).json({
        success: false,
        message: `Chi nhánh tạm ngưng từ ${formatDDMMYYYY(suspendDate)} đến ${
          resumeDate ? formatDDMMYYYY(resumeDate) : "chưa xác định"
        } — không thể đặt vào thời gian này.`,
      });
    }

    // Kiểm tra trước ngày hoạt động trở lại
    if (resumeDate && bookingDay < new Date(resumeDate).toISOString().split("T")[0]) {
      return res.status(400).json({
        success: false,
        message: `Chi nhánh sẽ hoạt động lại từ ${formatDDMMYYYY(resumeDate)} — vui lòng chọn ngày sau thời điểm này.`,
      });
    }

    // Lấy thông tin barber
    const barber = await db.Barber.findByPk(idBarber, {
      include: [{ model: db.User, as: "user", attributes: ["fullName", "email"] }],
    });

    if (!barber) {
      return res.status(404).json({ message: "Không tìm thấy barber!" });
    }

    // Tính tổng tiền
    const total = services.reduce((sum, s) => sum + s.price * (s.quantity || 1), 0);

    // Tạo booking
    const booking = await db.Booking.create({
      idCustomer,
      idBranch,
      idBarber,
      bookingDate,
      bookingTime,
      status: "Pending",
      description,
      total,
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

    return res.status(201).json({
      success: true,
      message: "Đặt lịch trực tiếp thành công!",
      data: booking,
    });
  } catch (error) {
    console.error("❌ Lỗi khi tạo booking trực tiếp:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo booking trực tiếp!",
      error: error.message,
    });
  }
};