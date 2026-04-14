import axios from "axios";

const API_URL = process.env.REACT_APP_API_BASE_URL + "/reels";

const reelApi = {
  getPaged: (page = 1, limit = 10, token) =>
    axios.get(`${API_URL}?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getByBarberId: (idBarber, page = 1, limit = 10, token) => {
    // Tận dụng logic đã có của axios để kiểm tra token
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return axios.get(`${API_URL}/barber/${idBarber}?page=${page}&limit=${limit}`, {
      headers: headers,
    });
  },
  getById: (id, token) =>
    axios.get(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } }),

  upload: (formData, token) =>
    axios.post(`${API_URL}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`
      },
    }),

  like: (idReel, token) =>
    axios.post(`${API_URL}/${idReel}/like`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getComments: (idReel) =>
    axios.get(`${API_URL}/${idReel}/comments`),

  addComment: (idReel, content, token) =>
    axios.post(`${API_URL}/${idReel}/comment`, { content }, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  addReply: (idComment, content, token) =>
    axios.post(`${API_URL}/comment/${idComment}/reply`, { content }, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateComment: (idComment, content, token) =>
    axios.put(`${API_URL}/comment/${idComment}`, { content }, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteComment: (idComment, token) =>
    axios.delete(`${API_URL}/comment/${idComment}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  trackView: (idReel, token) =>
    axios.post(`${API_URL}/${idReel}/view`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  search: (keyword, token) =>
    axios.get(`${API_URL}/search?q=${encodeURIComponent(keyword)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default reelApi;
