import * as request from "~/apis/configs/httpRequest";

// ==========================================
// 1. SERVICES CHO CLIENT (HOME & BOOKING)
// ==========================================

/**
 * Lấy danh sách danh mục và kiểu tóc đang hoạt động (Active)
 */
export const getClientCategoriesWithHairstyles = async () => {
  try {
    // Vì wrapper của bạn đã return res.data, nên ở đây 'res' chính là object chứa { success, data, message }
    const res = await request.get("/hairstyles/client/categories-with-hairstyles");
    
    if (res && res.success) {
      return res.data; // Trả về mảng các danh mục kèm kiểu tóc
    }
    throw new Error(res?.message || "Lấy danh sách kiểu tóc thất bại");
  } catch (error) {
    console.error("Lỗi getClientCategoriesWithHairstyles:", error);
    throw error;
  }
};

/**
 * Lấy chi tiết một kiểu tóc bằng Slug
 */
export const getClientHairstyleDetail = async (slug) => {
  try {
    const res = await request.get(`/hairstyles/client/hairstyles/${slug}`);
    if (res && res.success) {
      return res.data;
    }
    throw new Error(res?.message || "Lấy chi tiết kiểu tóc thất bại");
  } catch (error) {
    console.error(`Lỗi getClientHairstyleDetail với slug [${slug}]:`, error);
    throw error;
  }
};


// ==========================================
// 2. SERVICES CHO ADMIN (DASHBOARD)
// ==========================================

/* --- QUẢN LÝ DANH MỤC (CATEGORIES) --- */

export const getAdminCategories = async () => {
  try {
    const res = await request.get("/hairstyles/admin/categories");
    if (res && res.success) return res.data;
    throw new Error(res?.message || "Lấy danh sách danh mục thất bại");
  } catch (error) {
    console.error("Lỗi getAdminCategories:", error);
    throw error;
  }
};
export const createAdminCategory = async (data) => {
  try {
    const res = await request.post("/hairstyles/admin/categories", data);
    if (res && res.success) return res.data;
    throw new Error(res?.message || "Tạo danh mục thất bại");
  } catch (error) {
    console.error("Lỗi createAdminCategory:", error);
    throw error;
  }
};

export const updateAdminCategory = async (idCategory, data) => {
  try {
    const res = await request.put(`/hairstyles/admin/categories/${idCategory}`, data);
    if (res && res.success) return res.data;
    throw new Error(res?.message || "Cập nhật danh mục thất bại");
  } catch (error) {
    console.error(`Lỗi updateAdminCategory ID [${idCategory}]:`, error);
    throw error;
  }
};

export const deleteAdminCategory = async (idCategory) => {
  try {
    // Gọi đúng hàm 'del' được export từ file httpRequest.js của bạn
    const res = await request.del(`/hairstyles/admin/categories/${idCategory}`);
    if (res && res.success) return res.data;
    throw new Error(res?.message || "Xóa danh mục thất bại");
  } catch (error) {
    console.error(`Lỗi deleteAdminCategory ID [${idCategory}]:`, error);
    throw error;
  }
};


/* --- QUẢN LÝ KIỂU TÓC (HAIRSTYLES) --- */

export const getAdminHairstyles = async () => {
  try {
    const res = await request.get("/hairstyles/admin/hairstyles");
    if (res && res.success) return res.data;
    throw new Error(res?.message || "Lấy danh sách kiểu tóc thất bại");
  } catch (error) {
    console.error("Lỗi getAdminHairstyles:", error);
    throw error;
  }
};

export const createAdminHairstyle = async (formData) => {
  try {
    const res = await request.post("/hairstyles/admin/hairstyles", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res && res.success) return res.data;
    throw new Error(res?.message || "Tạo kiểu tóc thất bại");
  } catch (error) {
    console.error("Lỗi createAdminHairstyle:", error);
    throw error;
  }
};

export const updateAdminHairstyle = async (idHairstyle, formData) => {
  try {
    const res = await request.put(`/hairstyles/admin/hairstyles/${idHairstyle}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res && res.success) return res.data;
    throw new Error(res?.message || "Cập nhật kiểu tóc thất bại");
  } catch (error) {
    console.error(`Lỗi updateAdminHairstyle ID [${idHairstyle}]:`, error);
    throw error;
  }
};

export const deleteAdminHairstyle = async (idHairstyle) => {
  try {
    const res = await request.del(`/hairstyles/admin/hairstyles/${idHairstyle}`);
    if (res && res.success) return res.data;
    throw new Error(res?.message || "Xóa kiểu tóc thất bại");
  } catch (error) {
    console.error(`Lỗi deleteAdminHairstyle ID [${idHairstyle}]:`, error);
    throw error;
  }
};