import db from "../models/index.js";
import { Op, Sequelize } from "sequelize";
import moment from "moment";
import { sendBookingEmail } from "./mailService.js";
import { createNotification } from "./notificationService.js";
import { addBookingEventToCalendar } from "./googleCalendarService.js";
import VoucherService from "./voucherService.js";
// Lấy tất cả chi nhánh
export const getBranches = async (req, res) => {
  try {
    const branches = await db.Branch.findAll({
      where: { status: "Active" },
      attributes: [
        "idBranch",
        "name",
        "address",
        "openTime",
        "closeTime",
        "status",
        "slotDuration",
      ],
    });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách chi nhánh", error });
  }
};

// Lấy chi tiết chi nhánh (barbers + services)
export const getBranchDetail = async (branchId) => {
  const branch = await db.Branch.findByPk(branchId, {
    attributes: [
      "idBranch",
      "name",
      "address",
      "openTime",
      "closeTime",
      "status",
      "slotDuration",
    ],
    include: [
      {
        model: db.ServiceAssignment,
        include: [
          {
            model: db.Service,
            attributes: [
              "idService",
              "name",
              "description",
              "price",
              "duration",
              "status",
            ],
          },
          {
            model: db.Barber,
            attributes: ["idBarber", "profileDescription"],
            include: [
              {
                model: db.User,
                as: "user",
                attributes: ["idUser", "fullName", "email"],
              },
            ],
          },
        ],
      },
    ],
  });

  if (!branch) return null;

  // Gom nhóm lại barber + service
  const barbers = [];
  const services = [];

  branch.ServiceAssignments.forEach((assign) => {
    // Chuẩn hóa dữ liệu barber
    if (
      assign.Barber &&
      !barbers.find((b) => b.idBarber === assign.Barber.idBarber)
    ) {
      barbers.push({
        idBarber: assign.Barber.idBarber,
        name: assign.Barber.user?.fullName || "N/A",
        profileDescription: assign.Barber.profileDescription,
      });
    }

    // Chuẩn hóa dữ liệu service
    if (
      assign.Service &&
      !services.find((s) => s.idService === assign.Service.idService)
    ) {
      services.push({
        idService: assign.Service.idService,
        name: assign.Service.name,
        description: assign.Service.description,
        price: assign.Service.price,
        duration: assign.Service.duration,
        status: assign.Service.status,
      });
    }
  });

  return {
    branch: {
      idBranch: branch.idBranch,
      name: branch.name,
      address: branch.address,
      openTime: branch.openTime,
      closeTime: branch.closeTime,
      status: branch.status,
      slotDuration: branch.slotDuration,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    },
    barbers,
    services,
  };
};

// Tạo booking
export const createBookingService = async ({
  idCustomer,
  idBranch,
  idBarber,
  bookingDate,
  bookingTime,
  services,
  description,
  idCustomerVoucher,
  syncToCalendar = false,
}) => {
  // Lấy thông tin chi nhánh
  const branch = await db.Branch.findByPk(idBranch, {
    attributes: ["name", "address", "suspendDate", "resumeDate"],
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  // ====== CHECK NGÀY BOOKING ======
  const bookingDay = new Date(bookingDate).toISOString().split("T")[0];

  const { suspendDate, resumeDate } = branch;

  const formatDDMMYYYY = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString("vi-VN");
  };

  // Nếu chi nhánh đang tạm ngưng: suspendDate <= bookingDay < resumeDate (hoặc resumeDate chưa set)
  const isSuspendedNow =
    suspendDate &&
    bookingDay >= new Date(suspendDate).toISOString().split("T")[0] &&
    (!resumeDate ||
      bookingDay < new Date(resumeDate).toISOString().split("T")[0]);

  if (isSuspendedNow) {
    throw new Error(
      `Chi nhánh tạm ngưng từ ${formatDDMMYYYY(suspendDate)} đến ${resumeDate ? formatDDMMYYYY(resumeDate) : "chưa xác định"} — không thể đặt vào thời gian này.`,
    );
  }

  // Nếu đặt trước ngày hoạt động trở lại
  if (
    resumeDate &&
    bookingDay < new Date(resumeDate).toISOString().split("T")[0]
  ) {
    throw new Error(
      `Chi nhánh sẽ hoạt động lại từ ${formatDDMMYYYY(resumeDate)} — vui lòng chọn ngày sau thời điểm này.`,
    );
  }

  // ====== END CHECK ======

  // Lấy thông tin barber
  const barber = await db.Barber.findByPk(idBarber, {
    include: [{ model: db.User, as: "user", attributes: ["fullName"] }],
  });

  // Tính tổng giá
  const originalTotal = services.reduce(
    (sum, s) => sum + s.price * (s.quantity || 1),
    0,
  );
  let finalTotal = originalTotal;
  let discountAmount = 0;

  // Nếu có voucher, gọi applyVoucher để kiểm tra và cập nhật
  if (idCustomerVoucher) {
    try {
      const applyResult = await VoucherService.applyVoucher(
        idCustomerVoucher,
        idCustomer,
        originalTotal,
      );
      discountAmount = applyResult.discountAmount;
      finalTotal = applyResult.finalAmount;
    } catch (error) {
      throw new Error(`Voucher không hợp lệ: ${error.message}`);
    }
  }

  // Tạo booking với total đã được giảm giá
  const booking = await db.Booking.create({
    idCustomer,
    idBranch,
    idBarber,
    idCustomerVoucher,
    bookingDate,
    bookingTime,
    status: "Pending",
    description,
    finalTotal,
  });

  // Tạo chi tiết dịch vụ
  for (const s of services) {
    const service = await db.Service.findByPk(s.idService);
    if (service) {
      await db.BookingDetail.create({
        idBooking: booking.idBooking,
        idService: service.idService,
        quantity: s.quantity || 1,
        price: s.price,
      });
    }
  }

  // Lấy email khách
  const customer = await db.Customer.findByPk(idCustomer, {
    include: [
      { model: db.User, as: "user", attributes: ["email", "fullName"] },
    ],
  });

  // Gửi mail xác nhận
  if (customer?.user?.email) {
    await sendBookingEmail(customer.user.email, {
      branch: branch?.name || "Tên chi nhánh",
      branchAddress: branch?.address || "",
      barber: barber?.user?.fullName || "Tên barber",
      bookingDate,
      bookingTime,
      services,
      total: finalTotal,
    });
  }
  const serviceIds = services.map((s) => s.idService);
  const realServices = await db.Service.findAll({
    where: {
      idService: { [Op.in]: serviceIds },
    },
    attributes: ["idService", "name"],
  });

  // Map idService → name
  const serviceNameMap = {};
  realServices.forEach((s) => {
    serviceNameMap[s.idService] = s.name;
  });

  // Tạo danh sách tên dịch vụ đẹp
  const serviceNames = services
    .map((s) => serviceNameMap[s.idService] || "Dịch vụ không xác định")
    .join(", ");

  const formattedDate = moment(bookingDate).format("DD/MM/YYYY");

  const content = `Đặt lịch thành công!

Thợ cắt: ${barber?.user?.fullName || "Chưa xác định"}
Ngày: ${formattedDate}
Giờ: ${bookingTime}

Dịch vụ đã chọn:
• ${serviceNames || "Không có dịch vụ"}

Cảm ơn bạn đã tin tưởng Barbershop!`;

  await createNotification({
    type: "BOOKING",
    title: "Đặt lịch thành công!",
    content, // Nội dung xuống dòng đẹp
    targetRole: "customer",
    targetId: idCustomer,
  });

  if (syncToCalendar) {
    try {
      // Lấy thông tin khách hàng
      const customerData = await db.Customer.findByPk(idCustomer, {
        include: [
          {
            model: db.User,
            as: "user",
            attributes: ["email", "fullName", "phoneNumber"],
          },
        ],
      });
      if (customerData?.user) {
        // Gọi hàm calendar với đầy đủ tham số
        await addBookingEventToCalendar(idCustomer, {
          customerName: customerData.user.fullName,
          customerPhone: customerData.user.phoneNumber,
          customerEmail: customerData.user.email,
          services: services.map((s) => ({ idService: s.idService })),
          barberId: idBarber, // thêm barberId
          barberName: barber?.user?.fullName || "Chưa xác định",
          bookingDate,
          bookingTime,
          branchId: idBranch, // thêm branchId
          description: description || "",
        });
      }
    } catch (calendarErr) {
      console.error("Lỗi đồng bộ Google Calendar:", calendarErr);
      // Không throw lỗi để đặt lịch vẫn thành công
    }
  }
  return booking;
};
// Lấy danh sách booking theo id thợ và khoảng ngày
export const getBarberBookings = async (barberId, startDate, endDate) => {
  return await db.Booking.findAll({
    where: {
      idBarber: barberId,
      [Op.and]: [
        Sequelize.where(
          Sequelize.fn("DATE", Sequelize.col("bookingDate")),
          ">=",
          startDate,
        ),
        Sequelize.where(
          Sequelize.fn("DATE", Sequelize.col("bookingDate")),
          "<=",
          endDate,
        ),
      ],
    },
    include: [
      {
        model: db.Customer,
        include: [
          {
            model: db.User,
            as: "user",
            attributes: ["fullName", "phoneNumber", "image"],
          },
        ],
        attributes: ["idCustomer"],
      },
      {
        model: db.BookingDetail,
        as: "BookingDetails",
        include: [
          {
            model: db.Service,
            as: "service",
            attributes: ["name", "duration", "price"],
          },
        ],
        attributes: ["idBookingDetail", "quantity", "price"],
      },
    ],
    order: [
      ["bookingDate", "ASC"],
      ["bookingTime", "ASC"],
    ],
  });
};

export const completeBooking = async (
  idBooking,
  idBarber,
  uploadedImages,
  description,
) => {
  const booking = await db.Booking.findByPk(idBooking);
  if (!booking) throw new Error("Không tìm thấy lịch hẹn");

  // Lưu ảnh vào bảng CustomerGallery
  for (const img of uploadedImages) {
    await db.CustomerGallery.create({
      idBooking,
      uploadBy: idBarber,
      imageUrl: img.url,
      description: description || null,
    });
  }

  // Cập nhật trạng thái
  await booking.update({
    status: "Completed",
    description,
  });

  return {
    idBooking,
    status: "Completed",
    uploadedCount: uploadedImages.length,
  };
};

export const getBookedSlotsByBarber = async (
  idBranch,
  idBarber,
  bookingDate,
) => {
  try {
    const normalizedDate = moment(bookingDate).format("YYYY-MM-DD");

    // 1. Kiểm tra thợ có tồn tại không
    const barber = await db.Barber.findByPk(idBarber);
    if (!barber) throw new Error("Không tìm thấy thợ có ID này");

    // [FIX] 2. Check lockDate — nếu ngày đặt >= lockDate thì barber không làm việc nữa
    if (barber.lockDate) {
      const lockDay = new Date(barber.lockDate);
      lockDay.setHours(0, 0, 0, 0);
      const selectedDay = new Date(normalizedDate);
      selectedDay.setHours(0, 0, 0, 0);

      if (selectedDay >= lockDay) {
        // Lấy chi nhánh để trả về allSlots hợp lệ
        const branch = await db.Branch.findByPk(idBranch);
        if (branch) {
          const openTime = moment(branch.openTime, "HH:mm");
          const closeTime = moment(branch.closeTime, "HH:mm");
          const slotDuration = branch.slotDuration;
          const allSlots = [];
          let current = openTime.clone();
          while (current.isBefore(closeTime)) {
            allSlots.push(current.format("HH:mm"));
            current.add(slotDuration, "minutes");
          }
          return {
            barberId: idBarber,
            branchId: idBranch,
            date: normalizedDate,
            isUnavailable: true,
            reason: "lockDate",
            lockDate: barber.lockDate,
            bookedSlots: allSlots,
            availableSlots: [],
          };
        }
      }
    }

    // 3. Kiểm tra thợ có thuộc chi nhánh này không
    if (Number(barber.idBranch) !== Number(idBranch)) {
      throw new Error("Thợ không thuộc chi nhánh này");
    }

    // 4. Kiểm tra chi nhánh có tồn tại không
    const branch = await db.Branch.findByPk(idBranch);
    if (!branch) throw new Error("Không tìm thấy chi nhánh");

    // 5. Sinh toàn bộ khung giờ trong ngày
    const openTime = moment(branch.openTime, "HH:mm");
    const closeTime = moment(branch.closeTime, "HH:mm");
    const slotDuration = branch.slotDuration;

    const allSlots = [];
    let current = openTime.clone();
    while (current.isBefore(closeTime)) {
      allSlots.push(current.format("HH:mm"));
      current.add(slotDuration, "minutes");
    }

    // 6. Kiểm tra thợ có nghỉ trong ngày không
    const isUnavailable = await db.BarberUnavailability.findOne({
      where: {
        idBarber,
        startDate: { [Op.lte]: normalizedDate },
        endDate: { [Op.gte]: normalizedDate },
      },
    });

    if (isUnavailable) {
      return {
        barberId: idBarber,
        branchId: idBranch,
        date: normalizedDate,
        isUnavailable: true,
        reason: "unavailability",
        bookedSlots: allSlots,
        availableSlots: [],
      };
    }

    // 7. Lấy các booking hợp lệ trong ngày (không Cancelled)
    const bookings = await db.Booking.findAll({
      where: {
        idBarber,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("DATE", Sequelize.col("bookingDate")),
            normalizedDate,
          ),
        ],
        status: { [Op.not]: "Cancelled" },
      },
      attributes: ["bookingTime"],
      logging: false,
    });

    const bookedSlots = bookings.map((b) => b.bookingTime);

    return {
      barberId: idBarber,
      branchId: idBranch,
      date: normalizedDate,
      isUnavailable: false,
      lockDate: barber.lockDate || null,
      bookedSlots,
      availableSlots: allSlots.filter((s) => !bookedSlots.includes(s)),
    };
  } catch (error) {
    console.error("❌ Lỗi khi lấy khung giờ booking:", error);
    throw error;
  }
};

export const getBookingsByBranchService = async (idBranch, date) => {
  const barbers = await db.Barber.findAll({
    where: { idBranch },
    attributes: ["idBarber"],
    raw: true,
  });
  console.log("✅ barberIds:", barbers);
  const barberIds = barbers.map((b) => b.idBarber);
  if (!barberIds.length) return [];

  // Bước 2: build whereClause lọc theo barberIds
  const whereClause = {
    idBarber: { [Op.in]: barberIds },
  };

  if (date) {
    whereClause[Op.and] = [
      db.Sequelize.where(
        db.Sequelize.fn("DATE", db.Sequelize.col("Booking.bookingDate")),
        date,
      ),
    ];
  }
  console.log("✅ whereClause:", JSON.stringify(whereClause, null, 2));
  const bookings = await db.Booking.findAll({
    logging: (sql) => console.log("🔍 SQL:", sql),
    where: whereClause,
    include: [
      {
        model: db.Barber,
        as: "barber",
        required: false, // ✅ LEFT JOIN
        include: [
          {
            model: db.User,
            as: "user",
            attributes: ["idUser", "fullName", "phoneNumber"],
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
        model: db.Customer,
        required: false, // ✅ LEFT JOIN
        include: [
          {
            model: db.User,
            as: "user",
            attributes: ["idUser", "fullName", "phoneNumber"],
          },
        ],
        attributes: ["idCustomer"],
      },
      {
        model: db.BookingDetail,
        as: "BookingDetails",
        required: false,
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
        required: false,
        attributes: ["idTip", "tipAmount"],
      },
      {
        model: db.CustomerVoucher,
        as: "customerVoucher",
        // Lấy thêm id để frontend có thể revert nếu cần
        attributes: ["id", "status"],
        include: [
          {
            model: db.Voucher,
            as: "voucher",
            attributes: [
              "id",
              "name",
              "type",
              "discount_percent", // giảm theo %
              "discount_amount", // giảm cố định (POINTS_EXCHANGE)
              "max_discount_amount", // cap tối đa
              "min_invoice_amount", // ← THÊM: để frontend check khi lễ tân đổi dịch vụ
            ],
          },
        ],
      },
    ],
    order: [
      ["bookingDate", "ASC"],
      ["bookingTime", "ASC"],
    ],
  });

  return bookings
    .map((booking) => {
      try {
        const details = booking.BookingDetails || [];

        const serviceTotal = details.reduce(
          (sum, item) => sum + parseFloat(item.price) * (item.quantity || 1),
          0,
        );

        const tip = parseFloat(booking.BookingTip?.tipAmount || 0);
        const voucher = booking.customerVoucher?.voucher;

        // ── Tính discountAmount đã áp dụng lúc đặt lịch ──────────────────────
        // Dùng để hiển thị trong BookingList (không dùng để tính lại ở BookingInfo)
        let discountAmount = 0;
        let discountPercent = 0;
        let discountFixed = 0;

        if (voucher) {
          const fixedAmt = parseFloat(voucher.discount_amount || 0);
          const pct = parseFloat(voucher.discount_percent || 0);
          const maxDisc = parseFloat(voucher.max_discount_amount || 0);

          if (fixedAmt > 0) {
            // POINTS_EXCHANGE — giảm cố định
            discountFixed = Math.min(fixedAmt, serviceTotal);
            if (maxDisc > 0) discountFixed = Math.min(discountFixed, maxDisc);
            discountAmount = discountFixed;
          } else if (pct > 0) {
            // Giảm theo %
            discountPercent = pct;
            discountAmount = serviceTotal * (pct / 100);
            if (maxDisc > 0) discountAmount = Math.min(discountAmount, maxDisc);
          }
        }

        const total = serviceTotal - discountAmount + tip;

        return {
          idBooking: booking.idBooking,
          bookingDate: booking.bookingDate,
          bookingTime: booking.bookingTime,
          status: booking.status || "Pending",
          isPaid: Boolean(booking.isPaid),
          paymentMethod: booking.paymentMethod || null,
          description: booking.description || "",

          customer: booking.Customer
            ? {
                id: booking.Customer.idCustomer,
                name: booking.Customer.user?.fullName || "Khách lẻ",
                phone: booking.Customer.user?.phoneNumber || "",
              }
            : { id: 0, name: "Khách lẻ", phone: "" },

          barber: booking.barber
            ? {
                id: booking.barber.idBarber,
                name: booking.barber.user?.fullName || "",
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
            price: parseFloat(d.service?.price || d.price),
            quantity: d.quantity,
          })),

          // Voucher với đủ thông tin để BookingInfo tính lại khi lễ tân đổi dịch vụ
          voucher: voucher
            ? {
                customerVoucherId: booking.customerVoucher.id, // ← để revert khi cần
                id: voucher.id,
                name: voucher.name,
                type: voucher.type,
                discountPercent, // 0 nếu là fixed
                discountFixed, // 0 nếu là percent
                // Raw fields — BookingInfo dùng để tính lại
                rawDiscountPercent: parseFloat(voucher.discount_percent || 0),
                rawDiscountAmount: parseFloat(voucher.discount_amount || 0),
                maxDiscountAmount: parseFloat(voucher.max_discount_amount || 0),
                minInvoiceAmount: parseFloat(voucher.min_invoice_amount || 0),
              }
            : null,

          serviceTotal: serviceTotal.toFixed(0),
          tip: tip.toFixed(0),
          discountAmount: discountAmount.toFixed(0),
          discountPercent,
          discountFixed,
          total: total.toFixed(0),
        };
      } catch (err) {
        console.error("❌ Lỗi map booking:", booking.idBooking, err.message);
        return null;
      }
    })
    .filter(Boolean);
};

export const getBarberInfoForBooking = async (idBarber) => {
  const barber = await db.Barber.findByPk(idBarber);
  if (!barber) throw new Error("BARBER_NOT_FOUND");

  const unavailabilities = await db.BarberUnavailability.findAll({
    where: { idBarber },
    attributes: ["startDate", "endDate"],
    order: [["startDate", "ASC"]],
  });

  return {
    idBarber: barber.idBarber,
    isLocked: barber.isLocked,
    lockDate: barber.lockDate || null, // "YYYY-MM-DD" hoặc null
    unavailabilities: unavailabilities.map((u) => ({
      startDate: u.startDate, // "YYYY-MM-DD"
      endDate: u.endDate, // "YYYY-MM-DD"
    })),
  };
};

export const getBranchDetailsService = async (idBranch) => {
  const branch = await db.Branch.findByPk(idBranch, {
    include: [
      {
        model: db.Barber,
        as: "barbers",
        attributes: ["idBarber", "profileDescription", "isLocked", "lockDate"],
        where: { isLocked: false },
        required: false,
        include: [
          {
            model: db.User,
            as: "user",
            attributes: ["idUser", "fullName", "email", "image"],
          },
        ],
      },
      {
        model: db.Service,
        as: "services",
        attributes: [
          "idService",
          "name",
          "description",
          "price",
          "duration",
          "status",
        ],
        through: { attributes: [] },
      },
    ],
  });

  if (!branch) {
    throw new Error("Không tìm thấy chi nhánh");
  }

  const branchData = branch.toJSON();
  // Đảm bảo các trường time slot luôn có
  return {
    ...branchData,
    openTime: branch.openTime,
    closeTime: branch.closeTime,
    slotDuration: branch.slotDuration,
  };
};
export const cancelBookingService = async (idBooking) => {
  const booking = await db.Booking.findByPk(idBooking);
  if (!booking) {
    throw new Error("Không tìm thấy lịch hẹn để hủy");
  }
  if (booking.status !== "Pending") {
    throw new Error(
      `Không thể hủy lịch hẹn khi trạng thái đang là '${booking.status}'. Chỉ lịch hẹn Pending mới được phép hủy.`,
    );
  }
  booking.status = "Cancelled";
  await booking.save();
  return { message: "Đã hủy lịch hẹn thành công" };
};
export const checkInBookingService = async (idBooking) => {
  const booking = await db.Booking.findByPk(idBooking);
  if (!booking) {
    throw new Error("Không tìm thấy lịch hẹn");
  }
  if (booking.status !== "Pending") {
    throw new Error(
      `Chỉ có lịch hẹn Pending mới được check-in. Trạng thái hiện tại: '${booking.status}'`,
    );
  }
  booking.status = "InProgress";
  await booking.save();
  return {
    message: "Đã check-in lịch hẹn thành công",
    booking: {
      idBooking: booking.idBooking,
      status: booking.status,
    },
  };
};
