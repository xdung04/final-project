import * as request from "~/apis/configs/httpRequest";

const REEL_URL = "/reels";

// Không còn cần truyền token — cookie tự gửi kèm.
// LƯU Ý: res trả về đã bóc .data sẵn, đọc thẳng res.xxx ở nơi gọi thay vì
// res.data.xxx.
const reelApi = {
  getPaged: (page = 1, limit = 10) =>
    request.get(`${REEL_URL}?page=${page}&limit=${limit}`),

  // Trước đây có logic "token ? header : {}" để hỗ trợ cả khách chưa đăng
  // nhập (guest) lẫn user đã login (BE chắc dùng optionalAuthenticate cho
  // route này). Giờ cookie tự gửi nếu có, không gửi nếu không có — backend
  // tự xử lý đúng như trước, không cần phân nhánh ở FE nữa.
  getByBarberId: (idBarber, page = 1, limit = 10) =>
    request.get(`${REEL_URL}/barber/${idBarber}?page=${page}&limit=${limit}`),

  getById: (id) => request.get(`${REEL_URL}/${id}`),

  upload: (formData) =>
    request.post(`${REEL_URL}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  like: (idReel) => request.post(`${REEL_URL}/${idReel}/like`, {}),

  getComments: (idReel) => request.get(`${REEL_URL}/${idReel}/comments`),

  addComment: (idReel, content) =>
    request.post(`${REEL_URL}/${idReel}/comment`, { content }),

  addReply: (idComment, content) =>
    request.post(`${REEL_URL}/comment/${idComment}/reply`, { content }),

  updateComment: (idComment, content) =>
    request.put(`${REEL_URL}/comment/${idComment}`, { content }),

  deleteComment: (idComment) => request.del(`${REEL_URL}/comment/${idComment}`),

  trackView: (idReel) => request.post(`${REEL_URL}/${idReel}/view`, {}),

  search: (keyword) =>
    request.get(`${REEL_URL}/search?q=${encodeURIComponent(keyword)}`),
};

export default reelApi;