import voucherApi from "~/apis/voucherAPI";

// Không còn cần truyền token ở bất kỳ hàm nào — cookie tự gửi kèm.
//
// LƯU Ý FORMAT RESPONSE: voucherApi giờ gọi qua httpRequest.js, đã tự bóc 1
// lớp .data của axios rồi. Trước đây dùng axios gốc nên những API mà BE trả
// dạng { data: [...] } phải đọc `res.data.data` (2 lớp). Giờ chỉ còn 1 lớp:
// `res.data` (lớp axios đã bị bóc, chỉ còn lớp do BE đặt tên field "data").

// ── ADMIN ──────────────────────────────────────────────────────────────────────
export const fetchAllVouchers = async () => {
  const res = await voucherApi.getAll();
  return res?.data || [];
};

export const createVoucher = async (data) => {
  const res = await voucherApi.create(data);
  return res;
};

export const updateVoucher = async (id, data) => {
  const res = await voucherApi.update(id, data);
  return res;
};

export const deleteVoucher = async (id) => {
  const res = await voucherApi.delete(id);
  return res;
};

// ── CUSTOMER: Kho voucher ──────────────────────────────────────────────────────
export const fetchMyVouchers = async () => {
  const res = await voucherApi.getMyVouchers();
  return res?.data || [];
};

export const fetchVoucherHistory = async () => {
  const res = await voucherApi.getMyVoucherHistory();
  return res?.data || [];
};

// ── CUSTOMER: Campaign ─────────────────────────────────────────────────────────
export const fetchActiveCampaigns = async () => {
  const res = await voucherApi.getActiveCampaigns();
  return res?.data || [];
};

export const collectCampaignVoucher = async (voucherId) => {
  const res = await voucherApi.collectCampaign(voucherId);
  return res;
};

// ── CUSTOMER: Đổi điểm ────────────────────────────────────────────────────────
export const fetchExchangeableVouchers = async () => {
  const res = await voucherApi.getExchangeableVouchers();
  return res?.data || [];
};

export const exchangeVoucher = async (voucherId) => {
  const res = await voucherApi.exchangeVoucher(voucherId);
  return res;
};

export const fetchCustomerPoints = async () => {
  const res = await voucherApi.getCustomerPoints();
  return res.points;
};

export const sendRetentionVoucher = async (voucherId, customerIds) => {
  const res = await voucherApi.sendRetention(voucherId, customerIds);
  return res;
};