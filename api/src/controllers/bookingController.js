import db from "../models/index.js";
import * as bookingService from "../services/bookingService.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import { fetchBranchesWithDistance } from "../services/branchService.js";

export const getBranches = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const branches = await fetchBranchesWithDistance(lat, lng);
    return res.json(branches);
  } catch (error) {
    console.error("getBranches error:", error?.response?.data ?? error.message);
    res.status(500).json({ message: "Lỗi khi lấy danh sách chi nhánh", error });
  }
};

// [FIX] Trả thêm lockDate, isLocked của barber để FE block ngày đặt lịch
export const getBranchDetails = async (req, res) => {
  try {
    const { idBranch } = req.params;
    const branchData = await bookingService.getBranchDetailsService(idBranch);
    res.json(branchData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết chi nhánh", error });
  }
};


// Tạo booking
export const createBooking = async (req, res) => {
  try {
    const idUser = req.user.idUser;
    const userRole = req.user.role;

    if (userRole !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản nhân viên không được phép đặt lịch tại đây.",
      });
    }

    const customer = await db.Customer.findOne({ where: { idCustomer: idUser } });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin khách hàng tương ứng với tài khoản này.",
      });
    }

    const { syncToCalendar = false } = req.body;

    // [FIX] Validate lockDate trước khi tạo booking
    const { idBarber, bookingDate } = req.body;
    if (idBarber && bookingDate) {
      const barber = await db.Barber.findByPk(idBarber);
      if (barber?.lockDate) {
        const lockDay = new Date(barber.lockDate);
        lockDay.setHours(0, 0, 0, 0);
        const selectedDay = new Date(bookingDate);
        selectedDay.setHours(0, 0, 0, 0);

        if (selectedDay >= lockDay) {
          return res.status(400).json({
            success: false,
            message: `Thợ này sẽ nghỉ từ ngày ${new Date(barber.lockDate).toLocaleDateString(
              "vi-VN",
            )}. Vui lòng chọn ngày trước đó hoặc chọn thợ khác.`,
          });
        }
      }

      if (barber?.isLocked) {
        return res.status(400).json({
          success: false,
          message: "Tài khoản thợ đã bị khóa, không thể đặt lịch.",
        });
      }
    }

    const booking = await bookingService.createBookingService({
      ...req.body,
      idCustomer: customer.idCustomer,
      syncToCalendar,
    });

    return res.status(201).json({
      success: true,
      message: "Đặt lịch thành công",
      data: booking,
    });
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        success: false,
        message: "Lỗi hệ thống: Tài khoản của bạn chưa được kích hoạt quyền Khách hàng.",
      });
    }

    console.error("Lỗi khi tạo booking:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Booking của barber (theo khoảng thời gian)
export const getBookingsForBarber = async (req, res) => {
  try {
    const { idBarber, start, end } = req.query;

    if (!idBarber || !start || !end) {
      return res.status(400).json({ error: "Thiếu idBarber, start hoặc end" });
    }

    const bookings = await bookingService.getBarberBookings(parseInt(idBarber), start, end);
    return res.status(200).json(bookings);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const storage = new CloudinaryStorage({ 
  cloudinary,
  params: async () => ({
    folder: "customer-gallery",
    resource_type: "image",
  }),
});

export const upload = multer({ storage });

export const completeBooking = async (req, res) => {
  try {
    const idBooking = req.params.id;
    const { description, idBarber } = req.body;
    const files = req.files || {};
    const uploadedImages = [];

    for (const pos of ["front", "left", "right", "back"]) {
      const file = files[pos]?.[0];
      if (file) {
        uploadedImages.push({
          position: pos,
          url: file.path,
        });
      }
    }

    if (uploadedImages.length === 0) return res.status(400).json({ error: "Cần upload ít nhất 1 ảnh" });

    const result = await bookingService.completeBooking(idBooking, idBarber, uploadedImages, description);

    return res.status(200).json({
      message: "Đã hoàn tất lịch hẹn và lưu ảnh vào gallery khách hàng",
      ...result,
      uploadedImages,
    });
  } catch (err) {
    console.error("Lỗi hoàn tất lịch hẹn:", err);
    return res.status(500).json({ error: err.message });
  }
};

// [FIX] Sửa lại hàm này — getBarberBookingsNext7Days không tồn tại trong service
export const getBookingsByBarber = async (req, res) => {
  try {
    const { idBarber } = req.params;

    if (!idBarber) {
      return res.status(400).json({ success: false, message: "Thiếu idBarber" });
    }

    const barber = await db.Barber.findByPk(idBarber);
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thợ cắt tóc này.",
      });
    }

    // [FIX] Dùng hàm getBarberBookings có sẵn, lấy 7 ngày tới
    const today = new Date().toISOString().split("T")[0];
    const next7 = new Date();
    next7.setDate(next7.getDate() + 7);
    const end = next7.toISOString().split("T")[0];

    const bookings = await bookingService.getBarberBookings(parseInt(idBarber), today, end);

    return res.status(200).json({
      success: true,
      isLocked: barber.isLocked,
      lockDate: barber.lockDate || null,
      bookings,
    });
  } catch (error) {
    console.error("Lỗi Controller getBookingsByBarber:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi lấy lịch",
      error: error.message,
    });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { idBooking } = req.params;
    const result = await bookingService.cancelBookingService(idBooking);
    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi khi hủy lịch:", error);
    res.status(500).json({ message: "Lỗi khi hủy lịch", error: error.message });
  }
};

export const checkInBooking = async (req, res) => {
  try {
    const { idBooking } = req.params;
    const result = await bookingService.checkInBookingService(idBooking);
    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi khi check-in booking:", error);
    return res.status(500).json({
      message: "Lỗi khi check-in booking",
      error: error.message,
    });
  }
};

// [FIX] Thêm check lockDate trong getBookedSlotsByBarber
export const getBookedSlotsByBarber = async (req, res) => {
  try {
    const { idBarber } = req.params;
    const { branchId, date } = req.query;

    if (!idBarber || !branchId || !date) {
      return res.status(400).json({ message: "Thiếu tham số: idBarber, branchId hoặc date" });
    }

    const result = await bookingService.getBookedSlotsByBarber(parseInt(branchId), parseInt(idBarber), date);

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi khi lấy khung giờ booking:", error);

    if (error.message.includes("Không tìm thấy thợ")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("Thợ không thuộc chi nhánh")) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes("Không tìm thấy chi nhánh")) {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Lỗi khi lấy khung giờ booking của barber",
      error: error.message,
    });
  }
};

export const getBookingsByBranch = async (req, res) => {
  try {
    const { idBranch } = req.params;

    if (!idBranch) {
      return res.status(400).json({ success: false, message: "Thiếu idBranch" });
    }

    const isAdmin = req.user.role === "admin";
    if (!isAdmin && parseInt(idBranch) !== req.user.idBranch) {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ được xem booking của chi nhánh mình.",
      });
    }

    const { date } = req.query;

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Định dạng date không hợp lệ. Dùng YYYY-MM-DD",
      });
    }

    const result = await bookingService.getBookingsByBranchService(parseInt(idBranch), date || null);

    return res.status(200).json({
      success: true,
      total: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi getBookingsByBranch:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách booking theo chi nhánh",
      error: error.message,
    });
  }
};
