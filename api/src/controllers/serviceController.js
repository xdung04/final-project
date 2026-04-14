import * as serviceService from "../services/serviceService.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";


const serviceStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "service-images",
    resource_type: "image",
    public_id: `service_${Date.now()}`,
  }),
});
export const uploadServiceImage = multer({ storage: serviceStorage });

// Dịch vụ hot nhất (nhiều booking nhất)
export const getHot = async (req, res) => {
  try {
    const { page = 1, limit = 4 } = req.query;
    const result = await serviceService.getHotServicesPaged(
      parseInt(page),
      parseInt(limit)
    );
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Lấy chi tiết dịch vụ theo ID
export const getById = async (req, res) => {
  try {
    const service = await serviceService.getServiceById(req.params.id);
    if (!service) return res.status(404).json({ error: "Không tìm thấy dịch vụ" });
    return res.status(200).json(service);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const assignServiceToBranch = async (req, res) => {
  try {
    const { idService, idBranch } = req.body;
    const service = await serviceService.assignServiceToBranch(idService, idBranch);
    res.json({ message: "Service assigned to branch", service });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const { name, description, price, duration, branches } = req.body;
    const branchIds = JSON.parse(branches || "[]").map(Number);

    if (!name || !price || !duration) throw new Error("Tên, giá và thời lượng là bắt buộc");

    const data = {
      name: name.trim(),
      description: description?.trim() || null,
      price: parseFloat(price),
      duration: parseInt(duration),
      status: "Active",
      image: req.file ? req.file.path || req.file.filename : null,
    };

    console.log("Data gửi vào service:", { ...data, branchIds });

    const service = await serviceService.createService(data, branchIds);

    res.json({
      success: true,
      message: "Tạo dịch vụ thành công",
      data: service,
    });
  } catch (error) {
    console.error("Lỗi createService:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



export const updateService = async (req, res) => {
  try {
    const idService = req.params.id;
    const updateData = req.body;

    // Nếu có ảnh mới → upload lên Cloudinary
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "service-images",
        resource_type: "image",
      });
      updateData.image = result.secure_url;
    }

    const updated = await serviceService.updateService(idService, updateData);
    res.json({
      message: "Cập nhật dịch vụ thành công!",
      service: updated,
    });
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật dịch vụ:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    await serviceService.deleteService(req.params.id);
    res.json({ message: "Service deleted" });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const getAllServices = async (req, res) => {
  try {
    const services = await serviceService.getAllServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const unassignServiceFromBranch = async (req, res) => {
  try {
    const { idService, idBranch } = req.body;
    await serviceService.unassignServiceFromBranch(idService, idBranch);
    res.json({ message: "Unassigned branch successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// 🔹 Kiểm tra & tạm ẩn dịch vụ để chỉnh sửa
export const checkAndHideController = async (req, res) => {
  try {
    const idService = req.params.id;
    const result = await serviceService.checkAndHideService(idService);
    return res.status(200).json(result);
  } catch (error) {  // phải có 'error' ở đây
    console.error(error); // log chi tiết lỗi
    return res.status(500).json({ success: false, message: error.message });
  }
};

