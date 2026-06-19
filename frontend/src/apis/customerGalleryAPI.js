import * as request from "~/apis/configs/httpRequest";

const GALLERY_URL = "/customer-galleries";

// getByBarber là API public, không cần auth, giữ nguyên không đổi gì.
// getByCustomer cần đăng nhập — không còn truyền token, cookie tự gửi kèm.
const customerGalleryApi = {
  getByBarber: (barberId) => request.get(`${GALLERY_URL}/barber/${barberId}`),
  getByCustomer: () => request.get(`${GALLERY_URL}/customer`),
};

export default customerGalleryApi;