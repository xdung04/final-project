import serviceApi from "~/apis/serviceAPI";

// Lấy dịch vụ hot có phân trang
export const fetchHotServicesPaged = async (page, limit) => {
  const res = await serviceApi.getHotPaged(page, limit);
  return res.data;
};

// Lấy chi tiết dịch vụ
export const fetchServiceById = async (id) => {
  const res = await serviceApi.getById(id);
  return res.data;
};