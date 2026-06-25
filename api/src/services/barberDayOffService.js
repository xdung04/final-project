import { Op } from "sequelize";
import db from "../models/index.js";
import {
  notifyBookingCancelledDueToDayOff,
  notifyReceptionistBookingsCancelled,
} from "./notificationService.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
const toDateOnly = (d) => (d ? new Date(d).toISOString().split("T")[0] : null);
const today      = ()  => toDateOnly(new Date());

// ── Helper: lấy thông tin barber (tên + idBranch) ────────────────────────────
const getBarberInfo = async (idBarber) => {
  const barber = await db.Barber.findByPk(idBarber, {
    include: [
      { model: db.User,   as: "user",   attributes: ["fullName"] },
    ],
    attributes: ["idBarber", "idBranch"],
  });
  return {
    barberName: barber?.user?.fullName || "—",
    idBranch:   barber?.idBranch       || null,
  };
};

// ── Helper: lấy bookings bị ảnh hưởng (đầy đủ thông tin để notify) ──────────
const getAffectedBookings = async (idBarber, start, end) => {
  return await db.Booking.findAll({
    where: {
      idBarber,
      status:      { [Op.notIn]: ["Cancelled", "Completed"] },
      bookingDate: { [Op.between]: [start, end] },
    },
    include: [
      {
        model: db.Customer,
        include: [
          { model: db.User, as: "user", attributes: ["fullName", "phoneNumber"] },
        ],
      },
      {
        model: db.BookingDetail,
        include: [
          { model: db.Service, as: "service", attributes: ["name"] },
        ],
      },
    ],
    order: [["bookingDate", "ASC"]],
  });
};

// ── Helper: hủy booking + gửi notify ─────────────────────────────────────────
const cancelBookingsAndNotify = async ({ idBarber, startDate, endDate }) => {
  const start = toDateOnly(startDate);
  const end   = toDateOnly(endDate);

  const { barberName, idBranch } = await getBarberInfo(idBarber);

  // Lấy bookings trước khi hủy
  const bookings = await getAffectedBookings(idBarber, start, end);
  if (!bookings.length) return 0;

  // Hủy tất cả
  await db.Booking.update(
    { status: "Cancelled" },
    {
      where: {
        idBarber,
        status:      { [Op.notIn]: ["Cancelled", "Completed"] },
        bookingDate: { [Op.between]: [start, end] },
      },
    }
  );

  // Map data cho notify
  const bookingDataForCustomer = bookings.map((b) => ({
    idBooking:   b.idBooking,
    bookingDate: b.bookingDate,
    idCustomer:  b.idCustomer,
  }));

  const bookingDataForReceptionist = bookings.map((b) => ({
    idBooking:    b.idBooking,
    bookingDate:  b.bookingDate,
    customerName: b.Customer?.user?.fullName    || "—",
    phoneNumber:  b.Customer?.user?.phoneNumber || "—",
  }));

  // Gửi notify song song — best-effort
  await Promise.allSettled([
    notifyBookingCancelledDueToDayOff({ bookings: bookingDataForCustomer, barberName }),
    notifyReceptionistBookingsCancelled({
      idBranch,
      bookings: bookingDataForReceptionist,
      barberName,
      startDate: start,
      endDate:   end,
    }),
  ]);

  return bookings.length;
};

// ── 1. GET ALL ────────────────────────────────────────────────────────────────
export const getAllDayOffs = async () => {
  const rows = await db.BarberDayOff.findAll({
    include: [
      {
        model: db.Barber,
        include: [
          { model: db.User,   as: "user",   attributes: ["fullName"] },
          { model: db.Branch, as: "branch", attributes: ["idBranch", "name"] },
        ],
      },
    ],
    order: [["startDate", "DESC"]],
  });

  return rows.map((r) => ({
    idUnavailable: r.idUnavailable,
    idBarber:      r.idBarber,
    idBranch:      r.Barber?.idBranch      || null,
    barberName:    r.Barber?.user?.fullName || "—",
    branchName:    r.Barber?.branch?.name  || "—",
    startDate:     r.startDate,
    endDate:       r.endDate,
    reason:        r.reason,
    createdAt:     r.createdAt,
  }));
};

// ── 2. PREVIEW ────────────────────────────────────────────────────────────────
export const previewDayOff = async ({ idBarber, startDate, endDate, excludeId }) => {
  const start = toDateOnly(startDate);
  const end   = toDateOnly(endDate);

  // a) Check overlap
  const whereOverlap = {
    idBarber,
    startDate: { [Op.lte]: end   },
    endDate:   { [Op.gte]: start },
  };
  if (excludeId) whereOverlap.idUnavailable = { [Op.ne]: excludeId };

  const conflict = await db.BarberDayOff.findOne({ where: whereOverlap });
  if (conflict) {
    const err = new Error(
      `Lịch nghỉ bị trùng với khoảng ${toDateOnly(conflict.startDate)} → ${toDateOnly(conflict.endDate)}. Vui lòng chọn ngày khác.`
    );
    err.statusCode = 400;
    throw err;
  }

  // b) Check booking bị ảnh hưởng
  const bookings = await getAffectedBookings(idBarber, start, end);

  return {
    affectedCount: bookings.length,
    bookings: bookings.map((b) => ({
      idBooking:   b.idBooking,
      bookingDate: b.bookingDate,
      customer: {
        fullName:    b.Customer?.user?.fullName    || "—",
        phoneNumber: b.Customer?.user?.phoneNumber || "—",
      },
      services: b.BookingDetails?.map((d) => ({ name: d.service?.name || "—" })) || [],
    })),
  };
};

// ── 3. CREATE ─────────────────────────────────────────────────────────────────
export const createDayOff = async ({ idBarber, startDate, endDate, reason }) => {
  const start = toDateOnly(startDate);
  const end   = toDateOnly(endDate);

  // Lưu lịch nghỉ
  const record = await db.BarberDayOff.create({
    idBarber,
    startDate: start,
    endDate:   end,
    reason:    reason || null,
  });

  // Hủy booking + notify
  const cancelledCount = await cancelBookingsAndNotify({ idBarber, startDate: start, endDate: end });

  return { record, cancelledCount };
};

// ── 4. UPDATE ─────────────────────────────────────────────────────────────────
export const updateDayOff = async (idUnavailable, { startDate, endDate, reason }) => {
  const newStart = toDateOnly(startDate);
  const newEnd   = toDateOnly(endDate);

  const old = await db.BarberDayOff.findByPk(idUnavailable);
  if (!old) {
    const err = new Error("Không tìm thấy lịch nghỉ");
    err.statusCode = 404;
    throw err;
  }

  if (toDateOnly(old.startDate) <= today()) {
    const err = new Error("Không thể sửa lịch nghỉ đang diễn ra hoặc đã qua");
    err.statusCode = 400;
    throw err;
  }

  // Xóa cũ → tạo mới
  await old.destroy();

  const newRecord = await db.BarberDayOff.create({
    idBarber:  old.idBarber,
    startDate: newStart,
    endDate:   newEnd,
    reason:    reason || null,
  });

  // Hủy booking range mới + notify
  const cancelledCount = await cancelBookingsAndNotify({
    idBarber:  old.idBarber,
    startDate: newStart,
    endDate:   newEnd,
  });

  return { record: newRecord, cancelledCount };
};

// ── 5. DELETE ─────────────────────────────────────────────────────────────────
export const deleteDayOff = async (idUnavailable) => {
  const record = await db.BarberDayOff.findByPk(idUnavailable);
  if (!record) {
    const err = new Error("Không tìm thấy lịch nghỉ");
    err.statusCode = 404;
    throw err;
  }

  if (toDateOnly(record.startDate) <= today()) {
    const err = new Error("Không thể xóa lịch nghỉ đang diễn ra hoặc đã qua");
    err.statusCode = 400;
    throw err;
  }

  await record.destroy();
  return { idUnavailable, startDate: record.startDate, endDate: record.endDate };
};