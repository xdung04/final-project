"use strict";
import {
  getActiveCategoriesWithHairstyles,
  getActiveHairstyleBySlug,
  adminGetAllCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminGetAllHairstyles,
  adminCreateHairstyle,
  adminUpdateHairstyle,
  adminDeleteHairstyle,
} from "../services/hairStyleService.js";

// ==========================================
// 1. CONTROLLER CHO CLIENT (HOME & BOOKING)
// ==========================================

/**
 * GET /api/client/categories-with-hairstyles
 * Lấy danh sách danh mục và kiểu tóc đang hoạt động (Active) để hiển thị trang Home/Booking
 */
export const getClientCategoriesWithHairstyles = async (req, res) => {
  try {
    const data = await getActiveCategoriesWithHairstyles();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/client/hairstyles/:slug
 * Lấy thông tin chi tiết một kiểu tóc đang hoạt động bằng Slug
 */
export const getClientHairstyleDetail = async (req, res) => {
  try {
    const { slug } = req.params;
    const hairstyle = await getActiveHairstyleBySlug(slug);

    return res.status(200).json({
      success: true,
      data: hairstyle,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// 2. CONTROLLER CHO ADMIN (DASHBOARD CRUD)
// ==========================================

/* --- QUẢN LÝ DANH MỤC (CATEGORIES) --- */

/**
 * GET /api/admin/categories
 * Admin lấy toàn bộ danh sách danh mục (Cả Active lẫn Inactive)
 */
export const getAdminCategories = async (req, res) => {
  try {
    const categories = await adminGetAllCategories();

    return res.status(200).json({
      success: true,
      total: categories.length,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/admin/categories
 * Admin tạo mới một danh mục
 */
export const createAdminCategory = async (req, res) => {
  try {
    const newCategory = await adminCreateCategory(req.body);

    return res.status(201).json({
      success: true,
      message: "Tạo danh mục thành công",
      data: newCategory,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PUT /api/admin/categories/:idCategory
 * Admin cập nhật danh mục
 */
export const updateAdminCategory = async (req, res) => {
  try {
    const { idCategory } = req.params;
    const updatedCategory = await adminUpdateCategory(idCategory, req.body);

    return res.status(200).json({
      success: true,
      message: "Cập nhật danh mục thành công",
      data: updatedCategory,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE /api/admin/categories/:idCategory
 * Admin xóa mềm danh mục (Chuyển trạng thái sang Inactive của cả danh mục và các kiểu tóc bên trong)
 */
export const deleteAdminCategory = async (req, res) => {
  try {
    const { idCategory } = req.params;
    const result = await adminDeleteCategory(idCategory);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


/* --- QUẢN LÝ KIỂU TÓC (HAIRSTYLES) --- */

/**
 * GET /api/admin/hairstyles
 * Admin lấy toàn bộ danh sách kiểu tóc
 */
export const getAdminHairstyles = async (req, res) => {
  try {
    const hairstyles = await adminGetAllHairstyles();

    return res.status(200).json({
      success: true,
      total: hairstyles.length,
      data: hairstyles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/admin/hairstyles
 * Admin tạo mới một kiểu tóc
 */
export const createAdminHairstyle = async (req, res) => {
  try {
    const newHairstyle = await adminCreateHairstyle(req.body, req.files);

    return res.status(201).json({
      success: true,
      message: "Tạo kiểu tóc mới thành công",
      data: newHairstyle,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateAdminHairstyle = async (req, res) => {
  try {
    const { idHairstyle } = req.params;
    const updatedHairstyle = await adminUpdateHairstyle(idHairstyle, req.body, req.files);

    return res.status(200).json({
      success: true,
      message: "Cập nhật kiểu tóc thành công",
      data: updatedHairstyle,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE /api/admin/hairstyles/:idHairstyle
 * Admin xóa mềm kiểu tóc (Chuyển trạng thái sang Inactive)
 */
export const deleteAdminHairstyle = async (req, res) => {
  try {
    const { idHairstyle } = req.params;
    const result = await adminDeleteHairstyle(idHairstyle);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};