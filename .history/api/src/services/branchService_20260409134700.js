import db from "../models/index.js";
import { upsertBranches } from "./pineconeService.js";
const { Op } = db.Sequelize;
const Barber = db.Barber;
const Branch = db.Branch;
const Service = db.Service;
const Booking = db.Booking;

export const createBranch = async (data) => {
  try {
    const { 
      name, 
      address, 
      openTime, 
      closeTime, 
      slotDuration, 
      selectedServices,
      startDate // kiểu "2025-12-07 00:00:00"
    } = data;

    // ---- VALIDATION ----
    if (!name || !address || !openTime || !closeTime || !slotDuration || !startDate) {
      throw new Error("Thiếu thông tin bắt buộc khi tạo chi nhánh!");
    }

    // Parse startDate đúng chuẩn
    const inputDate = new Date(startDate);  // FIXED — parse full datetime

    if (isNaN(inputDate.getTime())) {
      throw new Error("Ngày bắt đầu hoạt động không hợp lệ!");
    }

  
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const compareDate = new Date(inputDate);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate <= today) {
      throw new Error("Ngày bắt đầu hoạt động phải từ ngày mai trở đi!");
    }

    // ---- CREATE BRANCH ----
    const newBranch = await Branch.create({
      name,
      address,
      openTime,
      closeTime,
      slotDuration,
      status: "Inactive",
      resumeDate: inputDate,  // OK
    });

    if (Array.isArray(selectedServices) && selectedServices.length > 0) {
      await newBranch.addServices(selectedServices);
    }

    const branchWithServices = await Branch.findByPk(newBranch.idBranch, {
      include: [{
        model: Service,
        as: "services",
        attributes: ["idService", "name", "price", "duration", "status"],
        through: { attributes: [] },
      }],
    });

    return branchWithServices;

  } catch (error) {
    console.error("Lỗi createBranch:", error);
    throw error;
  }
};


const updateBranch = async (id, data) => {
  try {
    const branch = await Branch.findByPk(id, {
      include: [{ model: Service, as: "services", attributes: ["idService"] }],
    });
    if (!branch) throw new Error("Không tìm thấy chi nhánh để cập nhật!");

    const { name, address, openTime, closeTime, slotDuration, status, selectedServices } = data;

    if (!name || !address || !openTime || !closeTime || !slotDuration) {
      throw new Error("Thiếu thông tin bắt buộc khi cập nhật chi nhánh!");
    }

    // ---- CẬP NHẬT THÔNG TIN CHI NHÁNH ----
    await branch.update({
      name,
      address,
      openTime,
      closeTime,
      slotDuration,
      status: status || branch.status,
    });

    // ---- CẬP NHẬT SERVICE ----
    if (Array.isArray(selectedServices)) {
      // Lấy danh sách service hiện tại của chi nhánh
      const currentServiceIds = branch.services.map((s) => s.idService);

      // Service mới cần add
      const servicesToAdd = selectedServices.filter((s) => !currentServiceIds.includes(s));
      // Service cần remove
      const servicesToRemove = currentServiceIds.filter((s) => !selectedServices.includes(s));

      if (servicesToAdd.length > 0) {
        await branch.addServices(servicesToAdd);
      }
      if (servicesToRemove.length > 0) {
        await branch.removeServices(servicesToRemove);
      }
    }

    // Load lại chi nhánh với services
    const updatedBranch = await Branch.findByPk(branch.idBranch, {
      include: [{ model: Service, as: "services" }],
    });

    return updatedBranch;
  } catch (error) {
    console.error("Lỗi updateBranch:", error);
    throw error;
  }
};

export const suspendBranch = async ({ branchId, suspendDate, resumeDate }) => {
  try {
    // 1. Lấy chi nhánh
    const branch = await Branch.findByPk(branchId);
    if (!branch) throw new Error("Chi nhánh không tồn tại!");

    // 2. Chuyển string sang Date
    const suspend = new Date(suspendDate);
    let resume = null;
    if (resumeDate) {
      resume = new Date(resumeDate);
      if (resume <= suspend) {
        throw new Error("Ngày hoạt động trở lại phải lớn hơn ngày bắt đầu tạm ngưng!");
      }
    }

    // 3. Kiểm tra booking trong khoảng thời gian
    const hasBooking = await Booking.findOne({
      where: {
        idBranch: branchId,
        bookingDate: {
          [Op.gte]: suspend,
          [Op.lte]: resume || new Date("9999-12-31") // nếu resume null -> vô hạn
        },
        status: { [Op.in]: ["Pending", "InProgress"] } // booking chưa hoàn tất
      }
    });

    if (hasBooking) {
      throw new Error("Chi nhánh đang có booking trong khoảng thời gian này, không thể tạm ngưng!");
    }

    branch.suspendDate = suspend;
    branch.resumeDate = resume || null;
    await branch.save();

    return { success: true, message: "Chi nhánh đã được tạm ngưng thành công!" };

  } catch (error) {
    console.error("Lỗi suspendBranch:", error.message);
    throw error;
  }
};



const getAllBranches = async () => {
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
    "resumeDate",   
    [
      db.Sequelize.literal(`(
        SELECT COUNT(*)
        FROM barbers AS b
        WHERE b.idBranch = Branch.idBranch
      )`),
      "totalBarbers",
    ],
  ],
  include: [
    {
      model: db.Service,
      as: "services",
      attributes: ["idService", "name", "price", "duration", "status"],
      through: { attributes: [] },
    },
  ],
  order: [["idBranch", "ASC"]],
});

    if (!branches.length) {
      return { message: "Không có chi nhánh nào trong hệ thống" };
    }

    return branches;
  } catch (error) {
    console.error("Lỗi getAllBranches:", error);
    throw error;
  }
};


const syncBranchesToPinecone = async () => {
  try {
    const branches = await db.Branch.findAll({
      attributes: ["idBranch", "name", "address", "status", "openTime", "closeTime"],
      include: [
        {
          model: db.Service,
          as: "services",
          attributes: ["idService", "name", "price", "duration", "status"],
          through: { attributes: [] },
        },
      ],
    });

    if (!branches.length) {
      return { message: "Không có dữ liệu chi nhánh để đồng bộ." };
    }

    const branchData = branches.map((b) => {
      const statusRaw = (b.status || "").trim().toLowerCase();
      const isActive =
        statusRaw === "active" ||
        statusRaw === "true" ||
        statusRaw === "1" ||
        statusRaw === "đang hoạt động";

      const serviceList =
        b.services?.length > 0
          ? b.services
              .map(
                (s) =>
                  `${s.name} (${parseFloat(s.price).toLocaleString("vi-VN")}₫ / ${s.duration} phút)`
              )
              .join(", ")
          : "Chưa có dịch vụ";

      return {
        idBranch: b.idBranch,
        name: b.name || "Chưa có tên chi nhánh",
        address: b.address || "Không có địa chỉ",
        status: b.status,
        openTime: b.openTime || "N/A",
        closeTime: b.closeTime || "N/A",
        displayText: `Chi nhánh: ${b.name || "Chưa có tên"}. Địa chỉ: ${
          b.address || "Không có địa chỉ"
        }. Trạng thái: ${isActive ? "Đang hoạt động" : "Ngừng hoạt động"}. Giờ mở cửa: ${
          b.openTime || "N/A"
        }. Giờ đóng cửa: ${b.closeTime || "N/A"}. Dịch vụ: ${serviceList}.`.trim(),
      };
    });

    await upsertBranches(branchData);

    return {
      message: "Dữ liệu chi nhánh (kèm dịch vụ) đã đồng bộ lên Pinecone thành công.",
      total: branchData.length,
    };
  } catch (error) {
    console.error("Lỗi đồng bộ chi nhánh:", error);
    return { message: " Lỗi server khi đồng bộ chi nhánh", error: error.message };
  }
};

const assignServiceToBranch = async (idBranch, idService) => {
  const branch = await Branch.findByPk(idBranch);
  const service = await Service.findByPk(idService);

  if (!branch || !service) throw new Error("Không tìm thấy chi nhánh hoặc dịch vụ");

  // Nếu dùng quan hệ N-N (belongsToMany)
  await branch.addService(service);

  return { message: "Gán dịch vụ thành công!" };
};

function parseDateSafe(input) {
  if (!input) return null;

  // TH1: đã là định dạng chuẩn JS parse được
  const d1 = new Date(input);
  if (!isNaN(d1.getTime())) return d1;

  // TH2: parse dạng YYYY-MM-DD
  const parts = input.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    return new Date(y, m - 1, d);
  }

  return null;
}

function parseDateYMD(input) {
  if (!input) return null;

  // ✅ Sequelize trả về Date → dùng luôn
  if (input instanceof Date) {
    return input;
  }

  // ❗ FE phải gửi string YYYY-MM-DD
  if (typeof input !== "string") {
    throw new Error("Ngày không đúng định dạng YYYY-MM-DD");
  }

  const parts = input.split("-");
  if (parts.length !== 3) {
    throw new Error("Ngày không đúng định dạng YYYY-MM-DD");
  }

  const [year, month, day] = parts.map(Number);
  return new Date(year, month - 1, day);
}

const setSuspendDate = async (branchId, suspendDate) => {
  try {
    const branch = await Branch.findByPk(branchId);
    if (!branch) return { success: false, message: "Chi nhánh không tồn tại!" };

    const suspend = parseDateSafe(suspendDate);
    if (!suspend) return { success: false, message: "Ngày tạm ngưng không hợp lệ!" };

    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    suspend.setHours(0, 0, 0, 0);

    if (suspend <= today) {
      return { success: false, message: "Ngày tạm ngưng phải lớn hơn ngày hôm nay ít nhất 1 ngày!" };
    }

    // Lấy tất cả booking liên quan tới chi nhánh
    const bookings = await Booking.findAll({
      include: [
        {
          model: Barber,
          as: "barber",
          where: { idBranch: branchId }, // join barber -> branch
          required: false, // tránh lỗi nếu barber không tồn tại
        },
      ],
      where: {
        bookingDate: { [Op.gte]: suspend },
        status: { [Op.in]: ["Pending", "InProgress"] },
      },
      order: [["bookingDate", "ASC"]],
    });

    if (bookings.length > 0) {
      const last = bookings[bookings.length - 1];
      const lastDateStr = last.bookingDate.toISOString().split("T")[0];

      return {
        success: false,
        hasBooking: true,
        lastBookingDate: last.bookingDate,
        message: `Không thể tạm ngưng vì có booking vào ngày ${lastDateStr}.`,
      };
    }

    branch.suspendDate = suspend;
    await branch.save();

    return { success: true, hasBooking: false, message: "Cài đặt ngày tạm ngưng chi nhánh thành công!" };
  } catch (error) {
    console.error("Lỗi setSuspendDate:", error);
    return { success: false, message: error.message || "Lỗi không xác định" };
  }
};



const setResumeDate = async (branchId, resumeDate) => {
  try {
    const branch = await Branch.findByPk(branchId);
    if (!branch) throw new Error("Chi nhánh không tồn tại!");

    if (!branch.suspendDate) {
      throw new Error("Chi nhánh chưa được thiết lập ngày tạm ngưng!");
    }

    const resume = parseDateSafe(resumeDate);
    if (!resume || isNaN(resume.getTime())) {
      throw new Error("Ngày hoạt động trở lại không hợp lệ!");
    }

    // ✅ VALIDATE CỐT LÕI
    if (resume <= branch.suspendDate) {
      throw new Error("Ngày hoạt động trở lại phải sau ngày tạm ngưng!");
    }

    branch.resumeDate = resume;

    await branch.save();

    return {
      success: true,
      message: "Chi nhánh đã được thiết lập ngày hoạt động lại!",
      resumeDate: branch.resumeDate,
    };
  } catch (error) {
    console.error("Lỗi setResumeDate:", error);
    throw error;
  }
};




export default {
  createBranch,
  updateBranch,
  getAllBranches,
  syncBranchesToPinecone,
  assignServiceToBranch,
  setSuspendDate,
  setResumeDate,
};
