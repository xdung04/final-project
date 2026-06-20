import reelApi from "~/apis/reelAPI";

// Không còn cần truyền token ở bất kỳ hàm nào — cookie tự gửi kèm.
// LƯU Ý: reelApi giờ trả thẳng data (đã bóc .data sẵn ở httpRequest.js),
// nên bỏ hết .data ở dưới.

export const fetchReelsPaged = async (page = 1, limit = 10) => {
  const res = await reelApi.getPaged(page, limit);
  return res;
};

export const fetchReelsByBarberId = async (idBarber, page = 1, limit = 10) => {
  const res = await reelApi.getByBarberId(idBarber, page, limit);
  return res;
};

export const fetchReelById = async (id) => {
  const res = await reelApi.getById(id);
  return res;
};

export const uploadReel = async (formData) => {
  const res = await reelApi.upload(formData);
  return res;
};

export const likeReel = async (idReel) => {
  const res = await reelApi.like(idReel);
  return res;
};

export const getComments = async (idReel) => {
  const res = await reelApi.getComments(idReel);
  return res;
};

export const addComment = async (idReel, content) => {
  const res = await reelApi.addComment(idReel, content);
  return res;
};

export const addReply = async (idComment, content) => {
  const res = await reelApi.addReply(idComment, content);
  return res;
};

export const updateComment = async (idComment, content) => {
  const res = await reelApi.updateComment(idComment, content);
  return res;
};

export const deleteComment = async (idComment) => {
  const res = await reelApi.deleteComment(idComment);
  return res;
};

// Trước đây check `if (!token) return;` để chỉ track view khi đã đăng nhập.
// Giờ không còn cách nào từ JS biết "có token hay không" (cookie httpOnly).
// Cứ gọi luôn — nếu route yêu cầu auth và chưa đăng nhập, BE tự trả 401,
// interceptor ở httpRequest.js sẽ nuốt lỗi này êm nếu cần. Nếu route này
// dùng optionalAuthenticate (cho phép cả guest) thì không vấn đề gì.
export const trackReelView = async (idReel) => {
  try {
    const res = await reelApi.trackView(idReel);
    return res;
  } catch (error) {
    // Không throw để không phá UI nếu user chưa đăng nhập mà vẫn xem reel
    console.error("Lỗi track reel view:", error);
  }
};

export const searchReels = async (keyword) => {
  const res = await reelApi.search(keyword);
  return res;
};