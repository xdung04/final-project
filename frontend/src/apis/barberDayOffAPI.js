import * as barberDayOffService from "~/services/barberDayOffService";

export const BarberDayOffAPI = {
  // Lấy toàn bộ lịch nghỉ
  getAll: async () => {
    try {
      const result = await barberDayOffService.getAllDayOffs();
      return result;
    } catch (error) {
      console.error("BarberDayOffAPI.getAll lỗi:", error);
      throw error;
    }
  },

  // Preview: kiểm tra overlap + booking bị ảnh hưởng trước khi lưu
  // payload: { idBarber, startDate, endDate, excludeId? }
  preview: async (payload) => {
    try {
      const result = await barberDayOffService.previewDayOff(payload);
      return result;
    } catch (error) {
      console.error("BarberDayOffAPI.preview lỗi:", error);
      throw error;
    }
  },

  // Tạo lịch nghỉ mới + tự động hủy booking trong range
  // payload: { idBarber, startDate, endDate, reason? }
  create: async (payload) => {
    try {
      const result = await barberDayOffService.createDayOff(payload);
      return result;
    } catch (error) {
      console.error("BarberDayOffAPI.create lỗi:", error);
      throw error;
    }
  },

  // Sửa lịch nghỉ (xóa cũ + tạo mới + hủy booking mới nếu có)
  // payload: { idBarber, startDate, endDate, reason? }
  update: async (id, payload) => {
    try {
      const result = await barberDayOffService.updateDayOff(id, payload);
      return result;
    } catch (error) {
      console.error("BarberDayOffAPI.update lỗi:", error);
      throw error;
    }
  },

  // Xóa lịch nghỉ — chỉ mở lại slot, không restore booking
  delete: async (id) => {
    try {
      const result = await barberDayOffService.deleteDayOff(id);
      return result;
    } catch (error) {
      console.error("BarberDayOffAPI.delete lỗi:", error);
      throw error;
    }
  },
};