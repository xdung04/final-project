import * as request from "~/apis/configs/httpRequest";

const VOUCHER_URL = "/vouchers";

// Không còn cần truyền token làm tham số — cookie (httpOnly) tự gửi kèm nhờ
// withCredentials: true ở httpRequest.js.
//
// LƯU Ý: request.get/post/put/delete đã TỰ BÓC .data ra rồi (xem httpRequest.js),
// nên kết quả trả về ở nơi gọi các hàm dưới đây giờ KHÔNG còn là object axios
// đầy đủ — đọc thẳng res.xxx thay vì res.data.xxx.
const voucherApi = {
  // ── ADMIN ──────────────────────────────────────────────────────────────────
  getAll: () => request.get(VOUCHER_URL),

  getById: (id) => request.get(`${VOUCHER_URL}/${id}`),

  create: (data) => request.post(VOUCHER_URL, data),

  update: (id, data) => request.put(`${VOUCHER_URL}/${id}`, data),

  delete: (id) => request.del(`${VOUCHER_URL}/${id}`),

  // ── CUSTOMER: Kho voucher ──────────────────────────────────────────────────
  getMyVouchers: () => request.get(`${VOUCHER_URL}/customer/available`),

  getMyVoucherHistory: () => request.get(`${VOUCHER_URL}/customer/history`),

  // ── CUSTOMER: Campaign ─────────────────────────────────────────────────────
  getActiveCampaigns: () => request.get(`${VOUCHER_URL}/customer/campaigns`),

  collectCampaign: (voucherId) =>
    request.post(`${VOUCHER_URL}/customer/collect`, { voucherId }),

  // ── CUSTOMER: Đổi điểm ────────────────────────────────────────────────────
  getExchangeableVouchers: () => request.get(`${VOUCHER_URL}/customer/exchangeable`),

  exchangeVoucher: (voucherId) =>
    request.post(`${VOUCHER_URL}/customer/exchange`, { voucherId }),

  getCustomerPoints: () => request.get(`${VOUCHER_URL}/customer/points`),

  sendRetention: (voucherId, customerIds) =>
    request.post(`${VOUCHER_URL}/retention/issue`, { voucherId, customerIds }),
};

export default voucherApi;