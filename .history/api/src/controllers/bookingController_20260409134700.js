import db from "../models/index.js";
import * as bookingService from "../services/bookingService.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";

export const getBranches = async (req, res) => {
  try {
    const branches = await db.Branch.findAll({
      attributes: [
        "idBranch",
        "name",
        "address",
        "openTime",
        "closeTime",
        "status",
        "slotDuration",
        "suspendDate",  
        "resumeDate"     
      ],
    });

    res.json(branches);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách chi nhánh",
      error
    });
  }
};


// Lấy chi tiết chi nhánh (barbers + services)
export const getBranchDetails = async (req, res) => {
  try {
    const { idBranch } = req.params;

    const branch = await db.Branch.findByPk(idBranch, {
      include: [
        {
          model: db.Barber,
          as: "barbers",
          attributes: ["idBarber", "profileDescription"],
          include: [
            {
              model: db.User,
              as: "user",
              attributes: ["idUser", "fullName", "email"],
            },
          ],
        },
        {
          model: db.Service,
          as: "services",
          attributes: ["idService", "name", "description", "price", "duration", "status"],
          through: { attributes: [] },
        },
      ],
    });

    if (!branch) {
      return res.status(404).json({ message: "Không tìm thấy chi nhánh" });
    }

    res.json(branch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết chi nhánh", error });
  }
};

// Tạo booking
export const createBooking = async (req, res) => {
  try {
    const idCustomer = req.user.idUser;

    const booking = await bookingService.createBookingService({
      ...req.body,
      idCustomer,
    });

    return res.status(201).json({
      success: true,
      message: "Đặt lịch thành công",
      data: booking,
    });

  } catch (error) {
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

// HOÀN TẤT LỊCH HẸN
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

// ✅ Lấy danh sách các booking của 1 barber
export const getBookingsByBarber = async (req, res) => {
  try {
    const { idBarber } = req.params;

    const bookings = await db.Booking.findAll({
      where: { idBarber },
      attributes: ["idBooking", "bookingDate", "bookingTime", "status"],
      order: [
        ["bookingDate", "DESC"],
        ["bookingTime", "ASC"],
      ],
    });

    const unavailabilities = await db.BarberUnavailability.findAll({
      where: { idBarber },
      attributes: ["idUnavailable", "startDate", "endDate", "reason"],
      order: [["startDate", "DESC"]],
    });

    res.json({ bookings, unavailabilities });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy thời gian booking và ngày nghỉ của barber", error });
  }
};

// ✅ HỦY BOOKING
export const cancelBooking = async (req, res) => {
  try {
    const { idBooking } = req.params;

    const booking = await db.Booking.findByPk(idBooking);

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy lịch hẹn để hủy" });
    }

    // ❌ Không cho hủy nếu là InProgress, Completed hoặc Cancelled
    if (booking.status !== "Pending") {
      return res.status(400).json({
        message: `Không thể hủy lịch hẹn khi trạng thái đang là '${booking.status}'. Chỉ lịch hẹn Pending mới được phép hủy.`,
      });
    }

    // ✅ Chỉ khi Pending mới đổi thành Cancelled
    booking.status = "Cancelled";
    await booking.save();

    return res.status(200).json({ message: "Đã hủy lịch hẹn thành công" });

  } catch (error) {
    console.error("❌ Lỗi khi hủy lịch:", error);
    res.status(500).json({ message: "Lỗi khi hủy lịch", error: error.message });
  }
};
// ✅ CHECK-IN BOOKING
export const checkInBooking = async (req, res) => {
  try {
    const { idBooking } = req.params;

    // Tìm booking
    const booking = await db.Booking.findByPk(idBooking);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
    }

    // Chỉ cho check-in khi trạng thái là Pending
    if (booking.status !== "Pending") {
      return res.status(400).json({
        message: `Chỉ có lịch hẹn Pending mới được check-in. Trạng thái hiện tại: '${booking.status}'`,
      });
    }

    // Cập nhật trạng thái
    booking.status = "InProgress";
    await booking.save();

    return res.status(200).json({
      message: "Đã check-in lịch hẹn thành công",
      booking: {
        idBooking: booking.idBooking,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error("❌ Lỗi khi check-in booking:", error);
    return res.status(500).json({
      message: "Lỗi khi check-in booking",
      error: error.message,
    });
  }
};


// ✅ Danh sách lịch hẹn bên Admin
export const getAllBookingDetails = async (req, res) => {
  try {
    const bookings = await db.Booking.findAll({
      include: [
        {
          model: db.Customer,
          include: [
            {
              model: db.User,
              as: "user",
              attributes: ["idUser", "fullName", "email", "phoneNumber"],
            },
          ],
          attributes: ["idCustomer", "address", "loyaltyPoint"],
        },
        {
          model: db.Barber,
          as: "barber",
          include: [
            {
              model: db.User,
              as: "user",
              attributes: ["idUser", "fullName", "email", "phoneNumber"],
            },
            {
              model: db.Branch,
              as: "branch",
              attributes: ["idBranch", "name", "address"],
            },
          ],
          attributes: ["idBarber"],
        },
        {
          model: db.BookingDetail,
          include: [
            {
              model: db.Service,
              as: "service",
              attributes: ["idService", "name", "price", "duration"],
            },
          ],
          attributes: ["idBookingDetail", "quantity", "price"],
        },
        {
          model: db.BookingTip,
          as: "BookingTip",
          attributes: ["tipAmount"],
        },

        // ✅ Thêm phần này để lấy voucher thông qua CustomerVoucher
        {
          model: db.CustomerVoucher,
          include: [
            {
              model: db.Voucher,
              as: "voucher",
              attributes: ["idVoucher", "title", "discountPercent", "description"],
            },
          ],
          attributes: ["id", "voucherCode", "status", "usedAt"],
        },
      ],
      order: [["bookingDate", "DESC"]],
    });

    const result = bookings.map((booking) => {
      const details = booking.BookingDetails || [];
      const subTotal = details.reduce((sum, item) => sum + parseFloat(item.price) * (item.quantity || 1), 0);
      const tip = parseFloat(booking.BookingTip?.tipAmount || 0);
      const total = subTotal + tip;

      const isPaid =
        booking.isPaid !== undefined ? Boolean(booking.isPaid) : booking.status?.toLowerCase() === "completed";

      // ✅ Lấy voucher nếu có
      const voucher = booking.CustomerVoucher?.voucher;

      return {
        idBooking: booking.idBooking,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        status: booking.status || "Pending",
        isPaid,
        description: booking.description || "",
        idVoucher: voucher?.idVoucher || null,
        voucher: voucher
          ? {
              title: voucher.title,
              discountPercent: parseFloat(voucher.discountPercent),
              description: voucher.description,
            }
          : null,
        customer: booking.Customer
          ? {
              id: booking.Customer.idCustomer,
              name: booking.Customer.user?.fullName,
              email: booking.Customer.user?.email,
              phone: booking.Customer.user?.phoneNumber,
            }
          : null,
        barber: booking.barber
          ? {
              id: booking.barber.idBarber,
              name: booking.barber.user?.fullName,
              branch: booking.barber.branch?.name,
            }
          : null,
        branch: booking.barber?.branch
          ? {
              id: booking.barber.branch.idBranch,
              name: booking.barber.branch.name,
              address: booking.barber.branch.address,
            }
          : null,
        services: details.map((d) => ({
          id: d.service?.idService,
          name: d.service?.name,
          price: parseFloat(d.service?.price),
          quantity: d.quantity,
        })),
        subTotal: subTotal.toFixed(2),
        tip: tip.toFixed(2),
        total: total.toFixed(2),
      };
    });

    res.status(200).json({
      message: "Lấy danh sách booking thành công",
      data: result,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách booking chi tiết:", error);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách booking chi tiết",
      error,
    });
  }
};

// ✅ Thanh toán booking + cộng điểm theo rule linh hoạt
export const payBooking = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { idBooking } = req.params;
    const { total, tip, services } = req.body;

    const booking = await db.Booking.findByPk(idBooking, { transaction: t });
    if (!booking) {
      await t.rollback();
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    if (booking.isPaid) {
      await t.rollback();
      return res.status(400).json({ message: "Lịch hẹn này đã được thanh toán" });
    }

    // ✅ Cập nhật dịch vụ
    if (Array.isArray(services) && services.length > 0) {
      await db.BookingDetail.destroy({ where: { idBooking }, transaction: t });
      const newDetails = services.map((idService) => ({
        idBooking,
        idService,
        price: 0,
      }));
      await db.BookingDetail.bulkCreate(newDetails, { transaction: t });
    }

    // ✅ Nếu có tip
    if (tip && Number(tip) > 0) {
      await db.BookingTip.create({ idBooking, idBarber: booking.idBarber, tipAmount: tip }, { transaction: t });
    }

    // ✅ Cập nhật trạng thái booking
    await booking.update(
      {
        isPaid: true,
        total: total || booking.total,
      },
      { transaction: t }
    );

    // ===== 🎯 CỘNG ĐIỂM LOYALTY =====
    const customer = await db.Customer.findByPk(booking.idCustomer, { transaction: t });
    if (customer) {
      const now = new Date();
      const orderTotal = total || booking.total;

      // 🔍 Tìm rule phù hợp nhất
      let rule = await db.LoyaltyRule.findOne({
        where: {
          is_active: true,
          [db.Sequelize.Op.or]: [{ start_date: null }, { start_date: { [db.Sequelize.Op.lte]: now } }],
          [db.Sequelize.Op.or]: [{ end_date: null }, { end_date: { [db.Sequelize.Op.gte]: now } }],
          min_order_amount: { [db.Sequelize.Op.lte]: orderTotal },
        },
        order: [["min_order_amount", "DESC"]],
        transaction: t,
      });

      // Nếu không có rule phù hợp → rule mặc định
      if (!rule) {
        rule = await db.LoyaltyRule.findOne({
          where: { is_default: true, is_active: true },
          transaction: t,
        });
      }

      if (rule) {
        const points = Math.floor((orderTotal / rule.money_per_point) * rule.point_multiplier);
        if (points > 0) {
          const newPoints = customer.loyaltyPoint + points;
          await customer.update({ loyaltyPoint: newPoints }, { transaction: t });

          console.log(`🎁 Cộng ${points} điểm (rule min ${rule.min_order_amount}) cho khách #${customer.idCustomer}`);
        }
      }
    }

    // ===== ✅ HOÀN TẤT =====
    await t.commit();
    return res.status(200).json({
      message: "Thanh toán thành công 🎉",
      booking: { idBooking: booking.idBooking, total, isPaid: true },
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ Lỗi thanh toán:", error);
    return res.status(500).json({ message: "Lỗi khi thanh toán", error: error.message });
  }
};

// ✅ Lấy khung giờ đã đặt
export const getBookedSlotsByBarber = async (req, res) => {
  try {
    const { idBarber } = req.params;
    const { branchId, date } = req.query;

    // 🧩 Kiểm tra thiếu tham số
    if (!idBarber || !branchId || !date) {
      return res.status(400).json({ message: "Thiếu tham số: idBarber, branchId hoặc date" });
    }

    // 🧠 Gọi service
    const result = await bookingService.getBookedSlotsByBarber(parseInt(branchId), parseInt(idBarber), date);

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi khi lấy khung giờ booking:", error);

    // 🔍 Phân loại lỗi để trả mã hợp lý
    if (error.message.includes("Không tìm thấy thợ")) {
      return res.status(404).json({ message: error.message });
    }

    if (error.message.includes("Thợ không thuộc chi nhánh")) {
      return res.status(400).json({ message: error.message });
    }

    if (error.message.includes("Không tìm thấy chi nhánh")) {
      return res.status(404).json({ message: error.message });
    }

    // ⚙️ Các lỗi khác (ngoài dự kiến)
    return res.status(500).json({
      message: "Lỗi khi lấy khung giờ booking của barber",
      error: error.message,
    });
  }
};
