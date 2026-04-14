import * as BarberService from "../services/barberService.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";

const getAllBarbers = async (req, res) => {
  try {
    const barbers = await BarberService.getAllBarbers();
    return res.status(200).json(barbers);
  } catch (error) {
    console.error("Lỗi getAllBarbers:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Đồng bộ dữ liệu barber vào Pinecone
const syncBarbers = async (req, res) => {
  try {
    const result = await BarberService.syncBarbersToPinecone();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi syncBarbers:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const assignUserAsBarber = async (req, res) => {
  try {
    const result = await BarberService.assignUserAsBarber(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignBarberToBranch = async (req, res) => {
  try {
    const { idBarber, idBranch } = req.body;
    const result = await BarberService.assignBarberToBranch(idBarber, idBranch);

    if (result.success) {
  return res.json({
    success: true,          // thêm dòng này
    message: result.message,
    barber: result.barber,
  });
} else {
  return res.status(400).json({
    success: false,         // thêm dòng này
    message: result.message,
    bookingId: result.bookingId,
  });
}

  } catch (error) {
    console.error("Lỗi assignBarberToBranch:", error);
    res.status(500).json({ error: error.message });
  }
};


const approveBarber = async (req, res) => {
  try {
    const { idBarber } = req.body;
    const barber = await BarberService.approveBarber(idBarber);
    res.json({ message: "Barber approved", barber });
  } catch (error) {
    console.error("Lỗi approveBarber:", error);
    res.status(404).json({ error: error.message });
  }
};

// Khóa barber
const lockBarber = async (req, res) => {
  try {
    const { idBarber } = req.body;
    const result = await BarberService.lockBarber(idBarber);

    if (!result.success) {
      // Còn booking => không khoá
      return res.status(400).json({ message: result.message });
    }

    // Nếu success === true => khoá thành công
    res.json({ message: result.message, barber: result.barber });
  } catch (error) {
    console.error("Lỗi lockBarber:", error);
    res.status(500).json({ error: error.message });
  }
};

// Mở khóa barber
const unlockBarber = async (req, res) => {
  try {
    const { idBarber } = req.body;
    const barber = await BarberService.unlockBarber(idBarber);
    res.json({ message: "Barber unlocked", barber });
  } catch (error) {
    console.error("Lỗi unlockBarber:", error);
    res.status(404).json({ error: error.message });
  }
};

export const getBarberReward = async (req, res) => {
  try {
    const { idBarber } = req.params;
    const rewardData = await BarberService.calculateBarberReward(idBarber);
    res.json(rewardData);
  } catch (error) {
    console.error("Error calculating reward:", error);
    res.status(500).json({ message: error.message || "Lỗi khi tính thưởng." });
  }
};
// 🔹 Tạo user + barber cùng lúc
const createBarberWithUser = async (req, res) => {
  try {
    const { email, password, fullName, phoneNumber, idBranch, profileDescription } = req.body;

    // Gọi xuống service xử lý logic
    const result = await BarberService.createBarberWithUser({
      email,
      password,
      fullName,
      phoneNumber,
      idBranch,
      profileDescription,
    });

    return res.status(201).json({
      message: "Tạo thợ cắt tóc thành công!",
      user: result.user,
      barber: result.barber,
    });
    } catch (error) {
      await t.rollback();
      console.error("❌ Lỗi khi tạo barber mới (chi tiết):", error.errors || error);
      throw new Error("Lỗi khi tạo barber mới: " + (error.message || "Không rõ"));
    }

};

// 🔹 Cập nhật barber (cho phép đổi pass, tên, sđt, branch, mô tả)
const updateBarber = async (req, res) => {
  try {
    const { idBarber } = req.params;
    const data = req.body;
    const result = await BarberService.updateBarber(idBarber, data);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi updateBarber:", error);
    return res.status(500).json({ message: "Lỗi khi cập nhật barber: " + error.message });
  }
};



export const addBarberUnavailability = async (req, res) => {
  try {
    const result = await BarberService.addBarberUnavailability(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("Lỗi khi thêm nghỉ phép:", error);
    res.status(500).json({
      message: error.message || "Không thể thêm lịch nghỉ phép.",
    });
  }
};

const getBarberUnavailabilities = async (req, res) => {
  try {
    const { idBarber } = req.params;
    const records = await BarberService.getUnavailabilitiesByBarber(idBarber);
    return res.status(200).json({ unavailabilities: records });
  } catch (error) {
    console.error("Lỗi khi lấy lịch nghỉ phép:", error);
    return res.status(500).json({ message: error.message });
  }
};

const getBarberProfile = async (req, res) => {
  try {
    const { idBarber } = req.params;
    const data = await BarberService.getProfile(idBarber);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "barber-profile",
    resource_type: "image",
  }),
});
const uploadAvatar = multer({ storage });

const updateBarberProfile = async (req, res) => {
  try {
    const { idBarber } = req.params;
    const payload = { ...req.body };

    // ✅ Cloudinary lưu ở file.path hoặc file.url tùy lib, nên check cả 2
    if (req.file) {
      payload.image = req.file.path || req.file.url;
    }

    if (payload.image && typeof payload.image !== "string") {
      delete payload.image;
    }

    const result = await BarberService.updateProfile(idBarber, payload);
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Lỗi updateProfile:", err);
    return res.status(500).json({ error: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const { idBarber } = req.params;
    const idUser = req.user.idUser; 

    if (idBarber != idUser) {
        return res.status(403).json({ error: "Không có quyền truy cập số liệu này." });
    }

    const stats = await BarberService.getDashboardStats(idBarber); 

    res.json(stats);
  } catch (err) {
    console.error("Lỗi khi lấy dashboard stats:", err);
    res.status(500).json({ error: "Không thể lấy dữ liệu thống kê." });
  }
};

export const getBarbersForHome = async (req, res) => {
  try {
    const barbers = await BarberService.getBarbersForDisplay();
    return res.status(200).json({
      total: barbers.length,
      data: barbers
    });
  } catch (error) {
    console.error("Lỗi getBarbersForHome:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
export default {
  getAllBarbers,
  syncBarbers,
  assignBarberToBranch,
  approveBarber,
  addBarberUnavailability,
  lockBarber,
  unlockBarber,
  assignUserAsBarber,
  getBarberReward,
  createBarberWithUser,
  updateBarber,
  getBarberUnavailabilities,
  getBarberProfile,
  updateBarberProfile,
  uploadAvatar,
  getDashboardStats,
   getBarbersForHome,
};