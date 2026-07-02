// src/services/bookingTools.js

import db from "../models/index.js";
import {
  getBookedSlotsByBarber,
  createBookingService,
} from "./bookingService.js";

export async function getBranches() {
  try {
    const branches = await db.Branch.findAll({
      where: { status: "Active" },
      attributes: ["idBranch", "name", "address", "openTime", "closeTime"],
    });
    return branches.map((b) => ({
      idBranch: b.idBranch,
      name: b.name,
      address: b.address,
      openTime: b.openTime,
      closeTime: b.closeTime,
    }));
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getBarbers({ idBranch }) {
  try {
    const barbers = await db.Barber.findAll({
      where: { idBranch, isLocked: false },
      include: [{ model: db.User, as: "user", attributes: ["fullName"] }],
    });
    return barbers.map((b, index) => ({
      stt: index + 1,
      idBarber: b.idBarber,
      name: b.user?.fullName || "Không rõ tên",
    }));
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getSlots({ idBranch, idBarber, bookingDate }) {
  try {
    const result = await getBookedSlotsByBarber(idBranch, idBarber, bookingDate);

    let availableSlots = result.availableSlots || [];

    const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
    if (bookingDate === todayStr) {
      const nowHour = new Date().toLocaleTimeString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false,
      });
      availableSlots = availableSlots.filter((slot) => slot > nowHour);
    }

    return {
      availableSlots,
      isUnavailable: result.isUnavailable || false,
      reason: result.reason || null,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      hint: "idBarber hoặc idBranch không hợp lệ. Hãy gọi lại getBarbers để lấy đúng idBarber thật từ DB, không dùng số thứ tự.",
    };
  }
}

export async function getServices({ idBranch }) {
  try {
    const assignments = await db.ServiceAssignment.findAll({
      where: { idBranch },
      include: [{
        model: db.Service,
        as: "service",
        where: { status: "Active" },
        attributes: ["idService", "name", "price", "duration"],
      }],
    });
    return assignments
      .map((a) => a.service)
      .filter(Boolean)
      .map((s) => ({
        idService: s.idService,
        name: s.name,
        price: Number(s.price),
        duration: s.duration,
      }));
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function createBooking({ state, customerId }) {
  try {
    const { idBranch, idBarber, bookingDate, slotTime, idServices, serviceNames } = state;

    const services = await Promise.all(
      idServices.map(async (id, idx) => {
        const svc = await db.Service.findByPk(id, {
          attributes: ["idService", "price", "name"],
        });
        return {
          idService: id,
          name: serviceNames[idx] || svc?.name,
          price: Number(svc?.price || 0),
          quantity: 1,
        };
      })
    );

    const booking = await createBookingService({
      idCustomer: customerId,
      idBranch,
      idBarber,
      bookingDate,
      bookingTime: slotTime,
      services,
      syncToCalendar: true,
    });

    return { success: true, idBooking: booking.idBooking };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
// bookingTools.js
export async function updateBookingState({ fields }) {
  try {
    const updatedFields = { ...fields };

    // ✅ Validate idBarber thực sự tồn tại và thuộc đúng idBranch (nếu cả 2 cùng được truyền,
    // hoặc idBranch đã có sẵn từ trước — nhưng ở đây ta chỉ có fields đơn lẻ nên validate
    // độc lập: idBarber phải tồn tại và không bị khoá)
    if (updatedFields.idBarber !== undefined && updatedFields.idBarber !== null) {
      const barber = await db.Barber.findOne({
        where: { idBarber: updatedFields.idBarber, isLocked: false },
        include: [{ model: db.User, as: "user", attributes: ["fullName"] }],
      });
      if (!barber) {
        return {
          success: false,
          error: `idBarber ${updatedFields.idBarber} không tồn tại hoặc không khả dụng. Hãy gọi lại getBarbers để lấy đúng ID.`,
        };
      }
      // Đồng bộ luôn tên thật từ DB, không tin tên LLM tự điền
      updatedFields.barberName = barber.user?.fullName || updatedFields.barberName;
    }

    // ✅ Validate idBranch
    if (updatedFields.idBranch !== undefined && updatedFields.idBranch !== null) {
      const branch = await db.Branch.findOne({
        where: { idBranch: updatedFields.idBranch, status: "Active" },
      });
      if (!branch) {
        return {
          success: false,
          error: `idBranch ${updatedFields.idBranch} không tồn tại hoặc không hoạt động. Hãy gọi lại getBranches.`,
        };
      }
      updatedFields.branchName = branch.name;
    }

    // ✅ Validate idServices — tất cả ID phải tồn tại và active
    if (Array.isArray(updatedFields.idServices) && updatedFields.idServices.length > 0) {
      const services = await db.Service.findAll({
        where: { idService: updatedFields.idServices, status: "Active" },
        attributes: ["idService", "name"],
      });
      if (services.length !== updatedFields.idServices.length) {
        const foundIds = services.map((s) => s.idService);
        const missing = updatedFields.idServices.filter((id) => !foundIds.includes(id));
        return {
          success: false,
          error: `idService không hợp lệ: ${missing.join(", ")}. Hãy gọi lại getServices.`,
        };
      }
      // Đồng bộ tên dịch vụ thật từ DB
      updatedFields.serviceNames = updatedFields.idServices.map(
        (id) => services.find((s) => s.idService === id)?.name
      );
    }

    return { success: true, updatedFields };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
export function resetBooking({ fields = [] } = {}) {
  try {
    const defaultState = {
      idBranch: null,
      branchName: null,
      idBarber: null,
      barberName: null,
      bookingDate: null,
      slotTime: null,
      idServices: [],
      serviceNames: [],
    };

    if (fields.length === 0) {
      return { success: true, clearedState: defaultState };
    }

    const clearedFields = {};
    fields.forEach((f) => {
      if (f in defaultState) clearedFields[f] = defaultState[f];
    });

    return { success: true, clearedFields };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function transferToReceptionist({ customerId }) {
  try {
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}