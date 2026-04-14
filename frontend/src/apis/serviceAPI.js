import axios from "axios";

const API_URL = process.env.REACT_APP_API_BASE_URL + "/services";

const serviceApi = {
  getHotPaged: (page = 1, limit = 4) =>
    axios.get(`${API_URL}/hot?page=${page}&limit=${limit}`),

  getAll: async () => {
    const res = await axios.get(API_URL);
    return res.data;
  },
  // 🔹 Lấy chi tiết dịch vụ theo ID
  getById: async (id) => {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data;
  },

  // 🔹 Tạo mới dịch vụ
  create: (data) =>
    axios.post(`${API_URL}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, data) =>
    axios.put(`${API_URL}/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // 🔹 Xóa dịch vụ
  delete: async (id) => {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
  },

  // 🔹 Gán dịch vụ cho chi nhánh
  assignBranch: async (idService, idBranch) => {
    const res = await axios.post(`${API_URL}/assign-branch`, {
      idService,
      idBranch,
    });
    return res.data;
  },
  unassignBranch: (idService, idBranch) =>
    axios.delete(`${API_URL}/unassign-branch`, {
      data: { idService, idBranch },
    }),
  checkAndHide: async (idService) => {
    const res = await axios.post(`${API_URL}/${idService}/check-hide`);
    return res.data;
  },
};

export default serviceApi;
