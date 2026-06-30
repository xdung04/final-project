"use strict";
import db from "../models/index.js";
import slugify from "slugify";
import cloudinary from "../config/cloudinary.js";
const { Category, Hairstyle } = db;

// ==========================================
// 1. CHỨC NĂNG CHO CLIENT (HOME & BOOKING)
// ==========================================

/**
 * Lấy danh sách toàn bộ danh mục đang hoạt động kèm các kiểu tóc đang hoạt động
 * Hệ thống tự lọc các mục có status là "Active"
 */
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "hairstyles" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};
export const getActiveCategoriesWithHairstyles = async () => {
  return await Category.findAll({
    where: { status: "Active" },
    attributes: ["idCategory", "name", "slug"],
    include: [
      {
        model: Hairstyle,
        as: "hairstyles",
        where: { status: "Active" },
        attributes: [
          "idHairstyle",
          "name",
          "slug",
          "shortDescription",
          "difficultyLevel",
          "maintenanceLevel",
          "suitableAge",
          "coverImage",
          "sideImage",
        ],
        required: false, // Vẫn hiện danh mục kể cả khi chưa có kiểu tóc nào
      },
    ],
    order: [
      ["name", "ASC"],
      [{ model: Hairstyle, as: "hairstyles" }, "name", "ASC"],
    ],
  });
};

/**
 * Lấy chi tiết kiểu tóc theo Slug (chỉ lấy kiểu tóc đang hoạt động)
 */
export const getActiveHairstyleBySlug = async (slug) => {
  const hairstyle = await Hairstyle.findOne({
    where: { slug, status: "Active" },
    include: [
      {
        model: Category,
        as: "category",
        where: { status: "Active" }, // Chỉ lấy nếu danh mục cha cũng đang hoạt động
        attributes: ["idCategory", "name", "slug"],
      },
    ],
  });

  if (!hairstyle) {
    throw new Error("Không tìm thấy kiểu tóc hoặc kiểu tóc này đã bị ẩn");
  }

  return hairstyle;
};


// ==========================================
// 2. CHỨC NĂNG QUẢN LÝ CHO ADMIN (CRUD)
// ==========================================

/* --- QUẢN LÝ DANH MỤC (CATEGORIES) --- */

/**
 * Admin lấy tất cả danh mục để quản lý (Xem cả Active và Inactive)
 */
export const adminGetAllCategories = async () => {
  return await Category.findAll({
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Admin thêm mới danh mục
 */
export const adminCreateCategory = async (data) => {
  if (!data.name) throw new Error("Tên danh mục không được để trống");
  
  const slug = slugify(data.name, { lower: true, locale: "vi" });

  const exist = await Category.findOne({ where: { slug } });
  if (exist) throw new Error("Danh mục này đã tồn tại trên hệ thống");

  return await Category.create({ ...data, slug });
};

/**
 * Admin cập nhật danh mục
 */
export const adminUpdateCategory = async (idCategory, data) => {
  const category = await Category.findByPk(idCategory);
  if (!category) throw new Error("Không tìm thấy danh mục cần cập nhật");

  const updateData = { ...data };
  if (data.name && data.name !== category.name) {
    updateData.slug = slugify(data.name, { lower: true, locale: "vi" });
    
    const exist = await Category.findOne({ where: { slug: updateData.slug } });
    if (exist && exist.idCategory !== idCategory) {
      throw new Error("Tên danh mục mới bị trùng lặp với danh mục khác");
    }
  }

  return await category.update(updateData);
};

/**
 * CHUYỂN TRẠNG THÁI: Xóa mềm danh mục (Soft Delete)
 * Chuyển trạng thái danh mục sang Inactive VÀ ẩn luôn toàn bộ kiểu tóc thuộc danh mục đó
 */
export const adminDeleteCategory = async (idCategory) => {
  const category = await Category.findByPk(idCategory);
  if (!category) throw new Error("Không tìm thấy danh mục để xóa");

  // 1. Chuyển trạng thái danh mục cha thành Inactive
  await category.update({ status: "Inactive" });

  // 2. Đồng thời chuyển toàn bộ kiểu tóc thuộc danh mục này thành Inactive để ẩn đồng bộ
  await Hairstyle.update(
    { status: "Inactive" },
    { where: { idCategory } }
  );

  return { message: "Ẩn danh mục và các kiểu tóc liên quan thành công (Xóa mềm)" };
};


/* --- QUẢN LÝ KIỂU TÓC (HAIRSTYLES) --- */

/**
 * Admin lấy toàn bộ danh sách kiểu tóc
 */
export const adminGetAllHairstyles = async () => {
  return await Hairstyle.findAll({
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["name"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Admin thêm kiểu tóc mới
 */
export const adminCreateHairstyle = async (body, files) => {
  // Upload 2 ảnh song song
  const [coverImageResult, sideImageResult] = await Promise.all([
    files?.coverImage?.[0] ? uploadToCloudinary(files.coverImage[0].buffer) : null,
    files?.sideImage?.[0] ? uploadToCloudinary(files.sideImage[0].buffer) : null,
  ]);

  if (!coverImageResult || !sideImageResult) {
    throw new Error("Vui lòng upload đủ coverImage và sideImage");
  }

  return await db.Hairstyle.create({
    ...body,
    coverImage: coverImageResult.secure_url,
    sideImage: sideImageResult.secure_url,
  });
};

export const adminUpdateHairstyle = async (idHairstyle, body, files) => {
  const hairstyle = await db.Hairstyle.findByPk(idHairstyle);
  if (!hairstyle) throw new Error("Không tìm thấy kiểu tóc");

  // Chỉ upload nếu có ảnh mới, không thì giữ URL cũ
  const [coverImageResult, sideImageResult] = await Promise.all([
    files?.coverImage?.[0] ? uploadToCloudinary(files.coverImage[0].buffer) : null,
    files?.sideImage?.[0] ? uploadToCloudinary(files.sideImage[0].buffer) : null,
  ]);

  await hairstyle.update({
    ...body,
    coverImage: coverImageResult ? coverImageResult.secure_url : hairstyle.coverImage,
    sideImage: sideImageResult ? sideImageResult.secure_url : hairstyle.sideImage,
  });

  return hairstyle;
};

/**
 * CHUYỂN TRẠNG THÁI: Xóa mềm kiểu tóc (Soft Delete)
 * Chuyển trạng thái kiểu tóc sang Inactive để ẩn khỏi giao diện client
 */
export const adminDeleteHairstyle = async (idHairstyle) => {
  const hairstyle = await Hairstyle.findByPk(idHairstyle);
  if (!hairstyle) throw new Error("Không tìm thấy kiểu tóc để xóa");

  // Chuyển trạng thái sang Inactive thay vì phá hủy bản ghi bằng .destroy()
  await hairstyle.update({ status: "Inactive" });
  
  return { message: "Ẩn kiểu tóc thành công (Xóa mềm)" };
};