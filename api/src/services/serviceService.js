import db from "../models/index.js";
import { Sequelize,Op  } from "sequelize";
import { upsertServices,deleteNamespace } from "./pineconeService.js";
const { Service, Branch, ServiceAssignment, BookingDetail,Booking  } = db;

// 🔹 Lấy dịch vụ mới nhất
export const getLatestServices = async (limit = 8) => {
  return await Service.findAll({
    order: [["createdAt", "DESC"]],
    limit,
  });
};
export const checkAndHideService = async (idService) => {
  const service = await Service.findByPk(idService);

  if (!service) {
    throw new Error("Service not found");
  }

  await service.update({ status: "Inactive" });

  return {
    success: true,
    message: "Dịch vụ đã tạm ẩn, bạn có thể chỉnh sửa.",
    statusUpdated: true,
  };
};

// 🔹 Lấy dịch vụ hot nhất có phân trang
export const getHotServicesPaged = async (page = 1, limit = 4) => {
  const offset = (page - 1) * limit;

  const { count, rows } = await Service.findAndCountAll({
    attributes: {
      include: [
        [
          Sequelize.fn("COUNT", Sequelize.col("bookingDetails.idBookingDetail")),
          "totalBookings",
        ],
      ],
    },
    include: [
      {
        model: db.BookingDetail,
        as: "bookingDetails", // 👈 alias phải khớp với Service.hasMany
        attributes: [],
      },
    ],
    group: ["Service.idService"],
    order: [[Sequelize.literal("totalBookings"), "DESC"]],
    limit,
    offset,
    subQuery: false,
    distinct: true,
  });

  return {
    total: Array.isArray(count) ? count.length : count,
    page,
    limit,
    data: rows,
  };
};

// 🔹 Lấy chi tiết dịch vụ theo ID
export const getServiceById = async (id) => {
  const service = await Service.findByPk(id, {
    include: [
      {
        model: Branch,
        as: "branches",
        attributes: ["idBranch", "name"],
        through: { attributes: [] },
      },
    ],
  });

  if (!service) return null;

  return {
    idService: service.idService,
    name: service.name,
    description: service.description,
    price: service.price,
    duration: service.duration,
    image: service.image,
    status: service.status,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
    branches: service.branches || [],
  };
};


// 🔹 Gán dịch vụ cho chi nhánh (tạo bản ghi ở bảng trung gian)
export const assignServiceToBranch = async (idService, idBranch) => {
  const service = await Service.findByPk(idService);
  if (!service) throw new Error("Service not found");

  await ServiceAssignment.create({ idService, idBranch });
  return { message: "Assigned successfully" };
};

export const createService = async (data, branchIds = []) => {
  try {
    let { name, description, price, duration, status, image } = data;

    // ✅ Trim chuỗi
    name = name?.trim();
    description = description?.trim() || null;

    // ✅ Ép kiểu số
    price = parseFloat(price);
    duration = parseInt(duration);

    // ✅ Validate bắt buộc
    if (!name) throw new Error("Tên dịch vụ không được để trống");
    if (isNaN(price) || price <= 0) throw new Error("Giá dịch vụ phải là số lớn hơn 0");
    if (isNaN(duration) || duration <= 0) throw new Error("Thời lượng phải là số nguyên lớn hơn 0");

    // ✅ Default status
    status = status || "Active";

    // ✅ Tạo service
    const service = await Service.create({ name, description, price, duration, status, image });

    // ✅ Nếu có branchIds → tạo liên kết bảng trung gian
    if (Array.isArray(branchIds) && branchIds.length > 0) {
      const records = branchIds.map(idBranch => ({
        idService: service.idService,
        idBranch,
      }));
      await ServiceAssignment.bulkCreate(records);
    }

    return service;
  } catch (err) {
    throw new Error(`Không thể tạo dịch vụ: ${err.message}`);
  }
};





export const updateService = async (idService, data) => {
  const service = await Service.findByPk(idService);
  if (!service) throw new Error("Service not found");

  // Kiểm tra các trường bắt buộc
  const requiredFields = ["name", "description", "price", "duration", "status"];
  const missingFields = requiredFields.filter(field => !data[field] && data[field] !== 0);

  if (missingFields.length > 0) {
    throw new Error(`Thiếu các trường bắt buộc: ${missingFields.join(", ")}`);
  }

  // Nếu không có ảnh mới, giữ ảnh cũ
  if (!data.image) {
    data.image = service.image;
  }

  return await service.update(data);
};


export const deleteService = async (idService) => {
  const service = await Service.findByPk(idService);
  if (!service) throw new Error("Service not found");
  await service.destroy();
  return true;
};

// 🔹 Lấy tất cả dịch vụ (kèm chi nhánh)
export const getAllServices = async () => {
  const services = await Service.findAll({
    attributes: [
      "idService",
      "name",
      "description",
      "price",
      "duration",
      "status",
    ],
  });

  return services;
};



export const unassignServiceFromBranch = async (idService, idBranch) => {
  const deleted = await db.ServiceAssignment.destroy({
    where: { idService, idBranch },
  });
  if (!deleted) throw new Error("Not assigned or already removed");
  return true;
};
export const syncServicesToPinecone = async () => {
  try {
    const services = await db.Service.findAll({
      include: [
        {
          model: db.Branch,
          as: "branches",
          attributes: ["idBranch", "name"],
          through: { attributes: [] },
        },
      ],
    });

    if (!services.length) {
      return { message: "Không có dữ liệu service để đồng bộ." };
    }

    const serviceData = services.map((s) => ({
      idService: s.idService,
      name: s.name,
      description: s.description || "Không có mô tả",
      price: Number(s.price),
      duration: s.duration,
      image: s.image || "",
      status: s.status,

      // Quan trọng
      branchIds: s.branches.map((b) => b.idBranch),
      branchNames: s.branches.map((b) => b.name),
    }));

    await deleteNamespace("services");

    await upsertServices(serviceData);

    return {
      message: "Service data synced to Pinecone.",
      total: serviceData.length,
    };
  } catch (error) {
    return {
      message: "Lỗi server",
      error: error.message,
    };
  }
};