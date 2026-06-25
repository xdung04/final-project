import * as request from "~/apis/configs/httpRequest";

const BASE = "/barber-day-offs";

// Lấy toàn bộ lịch nghỉ
export const getAllDayOffs = async () => {
  try {
    const res = await request.get(BASE);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Preview: kiểm tra overlap + booking bị ảnh hưởng
// payload: { idBarber, startDate, endDate, excludeId? }
export const previewDayOff = async (payload) => {
  try {
    const res = await request.post(`${BASE}/preview`, payload);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Tạo lịch nghỉ mới + tự động hủy booking trong range
// payload: { idBarber, startDate, endDate, reason? }
export const createDayOff = async (payload) => {
  try {
    const res = await request.post(BASE, payload);
    console.log("createDayOff trả về:", res);
    return res;
  } catch (error) {
    console.error("Lỗi createDayOff:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Sửa lịch nghỉ
// payload: { idBarber, startDate, endDate, reason? }
export const updateDayOff = async (id, payload) => {
  try {
    const res = await request.put(`${BASE}/${id}`, payload);
    console.log("updateDayOff trả về:", res);
    return res;
  } catch (error) {
    console.error("Lỗi updateDayOff:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Xóa lịch nghỉ — chỉ mở lại slot, không restore booking
export const deleteDayOff = async (id) => {
  try {
    const res = await request.del(`${BASE}/${id}`);
    console.log("deleteDayOff trả về:", res);
    return res;
  } catch (error) {
    console.error("Lỗi deleteDayOff:", error.response?.data || error);
    throw error.response?.data || error;
  }
};