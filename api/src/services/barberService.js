import db from "../models/index.js";
import { upsertBarbers } from "./pineconeService.js";
import { fn, col, Op } from "sequelize";
import ratingService from "./ratingService.js"; 
const Barber = db.Barber;
export const getAllBarbers = async () => {
  try {
    const barbers = await db.Barber.findAll({
      include: [
        { model: db.User, as: "user", attributes: ["fullName", "createdAt"] },
        { model: db.Branch, as: "branch", attributes: ["name"] },
        { model: db.BarberRatingSummary, as: "ratingSummary", attributes: ["avgRate"] },
        {
          model: db.Booking,
          as: "Bookings",
          attributes: ["idBooking", "idCustomer"], // 👈 lấy idCustomer để đếm khách
        },
      ],
    });

    if (!barbers.length) {
      return { message: "Không có dữ liệu barber." };
    }

    const now = new Date();

    const barberData = barbers.map((b) => {
      // 🔹 Tính kinh nghiệm (năm)
      const startDate = b.user?.createdAt ? new Date(b.user.createdAt) : now;
      const expYears = Math.max(0, now.getFullYear() - startDate.getFullYear());

      // 🔹 Tính số lượng khách hàng duy nhất
      const customerIds = b.Bookings?.map((bk) => bk.idCustomer).filter(Boolean) || [];
      const totalCustomers = new Set(customerIds).size;

      return {
        idBarber: b.idBarber,
        fullName: b.user?.fullName || "Chưa có tên",
        branchName: b.branch?.name || "Chưa có chi nhánh",
        exp: `${expYears} năm`,
        rating: Number(b.ratingSummary?.avgRate || 0).toFixed(1),
        customers: totalCustomers,
        isLocked: b.isLocked,
        isApproved: b.isApproved,
      };
    });

    return {
      total: barberData.length,
      barbers: barberData,
    };
  } catch (error) {
    console.error("Get All Barbers Error:", error);
    throw new Error("Lỗi server khi lấy danh sách barber: " + error.message);
  }
};

export const syncBarbersToPinecone = async () => {
  try {
    const barbers = await db.Barber.findAll({
      include: [
        { model: db.User, as: "user", attributes: ["fullName"] },
        { model: db.Branch, as: "branch", attributes: ["name"] },
        { model: db.BarberRatingSummary, as: "ratingSummary", attributes: ["avgRate"] }, // 👈 thêm dòng này
      ],
    });

    if (!barbers.length) {
      return { message: " Không có dữ liệu barber để đồng bộ." };
    }

    const barberData = barbers.map((b) => ({
      idBarber: b.idBarber,
      idBranch: b.idBranch,
      fullName: b.user?.fullName || "Chưa có tên",
      branchName: b.branch?.name || "Chưa có chi nhánh",
      profileDescription: b.profileDescription || "Không có mô tả",
      avgRate: b.ratingSummary?.avgRate || 0,
      displayText: `Tên barber: ${b.user?.fullName || "Chưa có tên"}, Chi nhánh: ${b.branch?.name || "Chưa có chi nhánh"}, Mô tả: ${b.profileDescription || "Không có mô tả"}, Đánh giá trung bình: ${b.ratingSummary?.avgRate || 0}`,
    }));


    await upsertBarbers(barberData);

    return { message: "Barber data synced to Pinecone (test).", total: barberData.length };
  } catch (error) {

    return { message: " Lỗi server", error: error.message };
  }
};

export const assignUserAsBarber = async (data) => {
  const t = await db.sequelize.transaction();
  try {
    const { idUser, idBranch, profileDescription } = data;

    // 1️⃣ Kiểm tra user tồn tại
    const user = await db.User.findByPk(idUser);
    if (!user) {
      throw new Error("Không tìm thấy user");
    }

    // 2️⃣ Cập nhật role = 'barber' (nếu chưa phải barber)
    if (user.role !== "barber") {
      user.role = "barber";
      await user.save({ transaction: t });
    }

    // 3️⃣ Kiểm tra xem đã có record trong bảng barbers chưa
    let barber = await db.Barber.findByPk(idUser);

    if (!barber) {
      // 🔹 Nếu chưa có thì tạo mới
      barber = await db.Barber.create(
        {
          idBarber: idUser,
          idBranch: idBranch || null,
          profileDescription: profileDescription || "Chưa có mô tả",
          isLocked: false,
        },
        { transaction: t }
      );
    } else {
      // 🔹 Nếu có rồi thì cập nhật
      barber.idBranch = idBranch ?? barber.idBranch;
      barber.profileDescription = profileDescription ?? barber.profileDescription;
      await barber.save({ transaction: t });
    }

    await t.commit();

    return {
      message: "Phân công user thành barber thành công",
      user,
      barber,
    };
  } catch (error) {
    await t.rollback();
    throw new Error("Lỗi khi phân công user thành barber: " + error.message);
  }
};

export const assignBarberToBranch = async (idBarber, idBranch) => {
  const barber = await Barber.findByPk(idBarber);
  if (!barber) {
    return {
      success: false,
      message: "Không tìm thấy barber",
    };
  }

  const now = new Date();

  // Kiểm tra booking tương lai ở chi nhánh cũ
  const futureBooking = await Booking.findOne({
    where: {
      idBarber,
      status: { [Op.in]: ["Pending", "InProgress"] },
      bookingDate: { [Op.gte]: now },
    },
    include: [
      {
        model: Barber,
        as: "barber",
        where: { idBranch: barber.idBranch }, // chi nhánh cũ
      },
    ],
  });

  if (futureBooking) {
    return {
      success: false,
      message: "Không thể chuyển chi nhánh. Thợ vẫn còn booking ở chi nhánh hiện tại.",
      bookingId: futureBooking.idBooking,
    };
  }

  barber.idBranch = idBranch;
  await barber.save();

  return {
    success: true,
    message: "Chuyển chi nhánh thành công!",
    barber,
  };
};

export const approveBarber = async (idBarber) => {
  const barber = await Barber.findByPk(idBarber);
  if (!barber) throw new Error("Khong tìm thấy barber");
  barber.isApproved = true;
  await barber.save();
  return barber;
};

export const lockBarber = async (idBarber) => {
  const barber = await Barber.findByPk(idBarber);
  if (!barber) throw new Error("Không tìm thấy barber");

  const hasFutureBooking = await Booking.findOne({
    where: {
      idBarber,
      status: { [Op.in]: ["Pending", "InProgress"] },
      bookingDate: { [Op.gte]: new Date() },
    },
  });
  if (hasFutureBooking) {
    return {
      success: false,
      message: "Không thể khóa barber. Thợ còn booking trong tương lai.",
    };
  }

  barber.isLocked = true;
  await barber.save();

  return {
    success: true,
    message: "Tài khoản barber đã bị khóa thành công!",
  };
};




export const unlockBarber = async (idBarber) => {
  const barber = await Barber.findByPk(idBarber);
  if (!barber) throw new Error("Khong tìm thấy barber");
  barber.isLocked = false;
  await barber.save();
  return barber;
};
export const calculateBarberReward = async (idBarber) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 1);

  // 1️⃣ Tổng doanh thu dịch vụ (Booking.total)
  const serviceRevenue = await db.Booking.sum("total", {
    where: {
      idBarber,
      isPaid: true,
      bookingDate: { [Op.gte]: startOfMonth, [Op.lt]: endOfMonth },
    },
  });

  // 2️⃣ Tổng tip
  const tipAmount = await db.BookingTip.sum("tipAmount", {
    include: [
      {
        model: db.Booking,
        as: "booking",
        where: {
          idBarber,
          isPaid: true,
          bookingDate: { [Op.gte]: startOfMonth, [Op.lt]: endOfMonth },
        },
        attributes: [],
      },
    ],
  });

  const totalServiceRevenue = Number(serviceRevenue) || 0;
  const totalTipAmount = Number(tipAmount) || 0;

  // 3️⃣ Lấy danh sách mốc thưởng
  const rewardRules = await db.BonusRule.findAll({
    where: { active: true },
    order: [["minRevenue", "ASC"]],
    raw: true,
  });

  if (!rewardRules.length) throw new Error("Không có mốc thưởng nào trong hệ thống.");

  // 4️⃣ Xác định mốc hiện tại và kế tiếp
  let currentRule = rewardRules[0];
  let nextRule = rewardRules[1] || null;

  for (let i = 0; i < rewardRules.length; i++) {
    if (totalServiceRevenue >= rewardRules[i].minRevenue) {
      currentRule = rewardRules[i];
      nextRule = rewardRules[i + 1] || null;
    }
  }

  // 5️⃣ Tính thưởng theo mốc cao nhất đạt được
  const bonus = Math.floor((totalServiceRevenue * currentRule.bonusPercent) / 100);

  // 6️⃣ Tính % progress sang mốc kế tiếp
  const progressPercent = nextRule
    ? Math.min((totalServiceRevenue / nextRule.minRevenue) * 100, 100)
    : 100;

  return {
    idBarber,
    month,
    year,
    serviceRevenue: totalServiceRevenue, // ✅ Doanh thu lấy từ Booking.total
    tipAmount: totalTipAmount,
    bonus,
    progressPercent,
    currentRule,
    nextRule,
    rewardRules,
  };
};


export const createBarberWithUser = async (data) => {
  const t = await db.sequelize.transaction();
  try {
    const { email, password, fullName, phoneNumber, idBranch, profileDescription } = data;

    // 1️⃣ Kiểm tra email trùng
    const existed = await db.User.findOne({ where: { email } });
    if (existed) {
      throw new Error("Email đã tồn tại trong hệ thống!");
    }

    // 2️⃣ Hash password
    const bcrypt = await import("bcrypt");
    const hashedPassword = await bcrypt.default.hash(password, 10);

    // 3️⃣ Tạo user mới với role = barber
    const newUser = await db.User.create(
      {
        email,
        password: hashedPassword,
        fullName,
        phoneNumber,
        role: "barber",
        isStatus: true,
      },
      { transaction: t }
    );

    // 4️⃣ Tạo bản ghi barber — cho phép idBranch = null
    const newBarber = await db.Barber.create(
      {
        idBarber: newUser.idUser,
        idBranch: idBranch || null, // ✅ Cho phép null
        profileDescription: profileDescription || "Chưa có mô tả",
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    return {
      message: "Tạo thợ cắt tóc mới thành công!",
      user: {
        idUser: newUser.idUser,
        email: newUser.email,
        fullName: newUser.fullName,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
      },
      barber: newBarber,
    };
  } catch (error) {
    await t.rollback();
    console.error("Lỗi khi tạo barber mới:", error);
    throw new Error("Lỗi khi tạo barber mới: " + error.message);
  }
};


export const updateBarber = async (idBarber, data) => {
  const t = await db.sequelize.transaction();
  try {
    const barber = await db.Barber.findByPk(idBarber, {
      include: [{ model: db.User, as: "user" }],
      transaction: t,
    });

    if (!barber) throw new Error("Không tìm thấy barber");

    // 🔹 Cập nhật thông tin User (nếu có)
    if (data.fullName) barber.user.fullName = data.fullName;
    if (data.phoneNumber) barber.user.phoneNumber = data.phoneNumber;
    if (data.email) barber.user.email = data.email;
    if (data.password) {
      barber.user.password = await bcrypt.hash(data.password, 10); // hash mới
    }
    await barber.user.save({ transaction: t });

    // 🔹 Cập nhật thông tin Barber
    if (data.idBranch !== undefined) barber.idBranch = data.idBranch || null;
    if (data.profileDescription !== undefined)
      barber.profileDescription = data.profileDescription;
    await barber.save({ transaction: t });

    await t.commit();
    return { message: "Cập nhật barber thành công!", barber };
  } catch (error) {
    await t.rollback();
    throw new Error("Lỗi khi cập nhật barber: " + error.message);
  }
};


export const addBarberUnavailability = async (data) => {
  const { idBarber, startDate, endDate, reason } = data;

  if (!idBarber || !startDate || !endDate || !reason) {
    throw new Error("Thiếu thông tin yêu cầu.");
  }

  const barber = await db.Barber.findByPk(idBarber);
  if (!barber) {
    throw new Error("Không tìm thấy thợ cắt tóc.");
  }

  // 🔹 Kiểm tra trùng lịch nghỉ
  const overlap = await db.BarberUnavailability.findOne({
    where: {
      idBarber,
      [db.Sequelize.Op.or]: [
        {
          startDate: { [db.Sequelize.Op.between]: [startDate, endDate] },
        },
        {
          endDate: { [db.Sequelize.Op.between]: [startDate, endDate] },
        },
        {
          [db.Sequelize.Op.and]: [
            { startDate: { [db.Sequelize.Op.lte]: startDate } },
            { endDate: { [db.Sequelize.Op.gte]: endDate } },
          ],
        },
      ],
    },
  });

  if (overlap) {
    throw new Error("❌ Thợ này đã có lịch nghỉ trong khoảng thời gian này!");
  }

  // 🔹 Tạo mới nếu không trùng
  const record = await db.BarberUnavailability.create({
    idBarber,
    startDate,
    endDate,
    reason,
  });

  return {
    message: " Đã thêm lịch nghỉ phép thành công.",
    record,
  };
};

export const getUnavailabilitiesByBarber = async (idBarber) => {
  const records = await db.BarberUnavailability.findAll({
    where: { idBarber },
    order: [["startDate", "ASC"]],
  });
  return records;
};

export const getProfile = async (idBarber) => {
  const barber = await Barber.findOne({
    where: { idBarber },
    include: [
      {
        model: db.User,
        as: "user",
        attributes: ["fullName", "image", "phoneNumber", "email"],
      },
      {
        model: db.Branch,
        as: "branch",
        attributes: ["name", "address"],
      },
    ],
  });

  if (!barber) throw new Error("Không tìm thấy thợ.");

  const ratingSummary = await ratingService.getRatingSummaryByBarber(idBarber);

  return {
    idBarber: barber.idBarber,
    fullName: barber.user?.fullName || "",
    image: barber.user?.image || "",
    phoneNumber: barber.user?.phoneNumber || "",
    email: barber.user?.email || "",
    branchName: barber.branch?.name || "Chưa có chi nhánh",
    branchAddress: barber.branch?.address || "",
    profileDescription: barber.profileDescription || "",
    avgRate: ratingSummary?.avgRate || 0,
    totalRate: ratingSummary?.totalRate || 0,
  };
};

export const updateProfile = async (idBarber, payload) => {
  const barber = await Barber.findByPk(idBarber, {
    include: [{ model: db.User, as: "user" }],
  });

  if (!barber) throw new Error("Không tìm thấy thợ.");

  const { fullName, image, phoneNumber, email, idBranch, profileDescription } =
    payload;

  if (barber.user) {
    await barber.user.update({
      fullName: fullName ?? barber.user.fullName,
      image: image ?? barber.user.image,
      phoneNumber: phoneNumber ?? barber.user.phoneNumber,
      email: email ?? barber.user.email,
    });
  }

  await barber.update({
    idBranch: idBranch ?? barber.idBranch,
    profileDescription: profileDescription ?? barber.profileDescription,
  });

  return { message: "Cập nhật hồ sơ thành công." };
};

const { Reel, ReelView, Booking, BarberRatingSummary } = db; 
// Hàm tính toán % thay đổi
const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
};

// Hàm lấy thống kê lượt xem Reels
const getReelViewsStats = async (idBarber, startOfWeek, endOfWeek, startOfLastWeek, endOfLastWeek) => {
    const barberReels = await Reel.findAll({
        where: { idBarber },
        attributes: ['idReel']
    });
    const reelIds = barberReels.map(r => r.idReel);

    if (reelIds.length === 0) {
        return { currentWeekViews: 0, lastWeekViews: 0 };
    }

    const [currentWeekViews, lastWeekViews] = await Promise.all([
        ReelView.count({
            where: {
                idReel: { [Op.in]: reelIds },
                lastViewedAt: { [Op.between]: [startOfWeek, endOfWeek] }, 
            },
            distinct: true, 
            col: 'idUser'
        }),
        ReelView.count({
            where: {
                idReel: { [Op.in]: reelIds },
                lastViewedAt: { [Op.between]: [startOfLastWeek, endOfLastWeek] },
            },
            distinct: true,
            col: 'idUser'
        }),
    ]);
    
    return { currentWeekViews, lastWeekViews };
};

export const getDashboardStats = async (idBarber) => {
  const now = new Date();

  // 🗓️ Tính ngày đầu tuần (Thứ 2) & cuối tuần (Chủ Nhật)
  const currentDay = now.getDay(); // CN = 0
  const mondayDiff = currentDay === 0 ? -6 : 1 - currentDay;

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + mondayDiff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // 📅 Đầu tháng & cuối tháng
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const [
    weeklyAppointments,
    totalReelViews,
    monthlyBookingRevenue,
    monthlyTipRevenue,
    ratingSummary,
  ] = await Promise.all([
    // 1️⃣ Tổng số lịch hẹn tuần này (Pending + Completed)
    db.Booking.count({
      where: {
        idBarber,
        bookingDate: { [Op.between]: [startOfWeek, endOfWeek] },
        status: { [Op.in]: ["Pending", "Completed"] },
      },
    }),

    // 2️⃣ Tổng lượt view unique Reel
    db.ReelView.count({
      include: [
        {
          model: db.Reel,
          where: { idBarber }, // chỉ tính view của Barber này
          attributes: [],
        },
      ],
      distinct: true,
      col: "idUser", // đếm unique theo idUser
    }),

    // 3️⃣ Doanh thu tháng này: SUM Booking.total (đã thanh toán)
    db.Booking.sum("total", {
      where: {
        idBarber,
        isPaid: true,
        bookingDate: { [Op.between]: [startOfMonth, endOfMonth] },
      },
    }),

    // 4️⃣ Tổng Tip tháng này (JOIN BookingTip -> Booking)
    db.BookingTip.sum("tipAmount", {
      include: [
        {
          model: db.Booking,
          as: "booking", // đúng alias trong association
          where: {
            idBarber,
            isPaid: true,
            bookingDate: { [Op.between]: [startOfMonth, endOfMonth] },
          },
          attributes: [],
        },
      ],
    }),

    // 5️⃣ Điểm đánh giá trung bình
    db.BarberRatingSummary.findOne({
      where: { idBarber },
      attributes: ["avgRate"],
    }),
  ]);

  const monthlyRevenue =
    (parseFloat(monthlyBookingRevenue) || 0) +
    (parseFloat(monthlyTipRevenue) || 0);

  return {
    totalAppointmentsThisWeek: weeklyAppointments,
    totalReelViews,
    monthlyRevenue,
    avgRating: parseFloat(ratingSummary?.avgRate || 0),
  };
};


export const getBarbersForDisplay = async () => {
  try {
    const barbers = await db.Barber.findAll({
      include: [
        { model: db.User,   as: "user",   attributes: ["fullName", "image"] },
        { model: db.Branch, as: "branch", attributes: ["name", "address"] },
        { model: db.BarberRatingSummary, as: "ratingSummary", attributes: ["avgRate"] },
      ],
      where: { isLocked: false }
    });

    const result = barbers.map(b => ({
      idBarber: b.idBarber, 
      name: b.user?.fullName || "Chưa có tên",
      branch: b.branch?.name || "Chưa có chi nhánh",
      address: b.branch?.address || "Chưa có địa chỉ",
      description: b.profileDescription || "",
      rating: Number(b.ratingSummary?.avgRate || 0).toFixed(1),
      avatar: b.user?.image || ""
    }));

    return result;
  } catch (err) {
    console.error("Error in getBarbersForDisplay:", err);
    throw new Error("Lỗi server khi lấy danh sách thợ cắt tóc");
  }
};
