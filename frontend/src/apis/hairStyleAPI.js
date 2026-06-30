import * as hairstyleService from "~/services/hairStyleService";

// Thay đổi từ HairstyleAPI thành hairStyleAPI ở đây
export const hairStyleAPI = {
  // ==========================================
  // CLIENT APIS
  // ==========================================
  
  /**
   * Lấy danh mục và kiểu tóc hiển thị ở Home / Lịch hẹn khách hàng
   */
  getClientCategoriesWithHairstyles: async () => {
    try {
      return await hairstyleService.getClientCategoriesWithHairstyles();
    } catch (error) {
      console.error("hairStyleAPI.getClientCategoriesWithHairstyles lỗi:", error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết kiểu tóc bằng slug để làm trang Detail
   */
  getClientHairstyleDetail: async (slug) => {
    try {
      return await hairstyleService.getClientHairstyleDetail(slug);
    } catch (error) {
      console.error("hairStyleAPI.getClientHairstyleDetail lỗi:", error);
      throw error;
    }
  },

  // ==========================================
  // ADMIN APIS
  // ==========================================

  /* --- QUẢN LÝ DANH MỤC --- */
  getAdminCategories: async () => {
    try {
      return await hairstyleService.getAdminCategories();
    } catch (error) {
      console.error("hairStyleAPI.getAdminCategories lỗi:", error);
      throw error;
    }
  },

  createAdminCategory: async (data) => {
    try {
      return await hairstyleService.createAdminCategory(data);
    } catch (error) {
      console.error("hairStyleAPI.createAdminCategory lỗi:", error);
      throw error;
    }
  },

  updateAdminCategory: async (idCategory, data) => {
    try {
      return await hairstyleService.updateAdminCategory(idCategory, data);
    } catch (error) {
      console.error("hairStyleAPI.updateAdminCategory lỗi:", error);
      throw error;
    }
  },

  deleteAdminCategory: async (idCategory) => {
    try {
      return await hairstyleService.deleteAdminCategory(idCategory);
    } catch (error) {
      console.error("hairStyleAPI.deleteAdminCategory lỗi:", error);
      throw error;
    }
  },

  /* --- QUẢN LÝ KIỂU TÓC --- */
  getAdminHairstyles: async () => {
    try {
      return await hairstyleService.getAdminHairstyles();
    } catch (error) {
      console.error("hairStyleAPI.getAdminHairstyles lỗi:", error);
      throw error;
    }
  },

createAdminHairstyle: async (formData) => {
  try {
    return await hairstyleService.createAdminHairstyle(formData);
  } catch (error) {
    console.error("hairStyleAPI.createAdminHairstyle lỗi:", error);
    throw error;
  }
},

updateAdminHairstyle: async (idHairstyle, formData) => {
  try {
    return await hairstyleService.updateAdminHairstyle(idHairstyle, formData);
  } catch (error) {
    console.error("hairStyleAPI.updateAdminHairstyle lỗi:", error);
    throw error;
  }
},

  deleteAdminHairstyle: async (idHairstyle) => {
    try {
      return await hairstyleService.deleteAdminHairstyle(idHairstyle);
    } catch (error) {
      console.error("hairStyleAPI.deleteAdminHairstyle lỗi:", error);
      throw error;
    }
  },
};