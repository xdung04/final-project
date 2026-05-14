import voucherApi from "~/apis/voucherAPI";

// ── ADMIN ──────────────────────────────────────────────────────────────────────
export const fetchAllVouchers = async (token) => {
  const res = await voucherApi.getAll(token);
  return res.data?.data || [];
};

export const createVoucher = async (token, data) => {
  const res = await voucherApi.create(token, data);
  return res.data;
};

export const updateVoucher = async (token, id, data) => {
  const res = await voucherApi.update(token, id, data);
  return res.data;
};

export const deleteVoucher = async (token, id) => {
  const res = await voucherApi.delete(token, id);
  return res.data;
};

// ── CUSTOMER: Kho voucher ──────────────────────────────────────────────────────
export const fetchMyVouchers = async (token) => {
  const res = await voucherApi.getMyVouchers(token);
  return res.data?.data || [];
};

export const fetchVoucherHistory = async (token) => {
  const res = await voucherApi.getMyVoucherHistory(token);
  return res.data?.data || [];
};

// ── CUSTOMER: Campaign ─────────────────────────────────────────────────────────
export const fetchActiveCampaigns = async (token) => {
  const res = await voucherApi.getActiveCampaigns(token);
  return res.data?.data || [];
};

export const collectCampaignVoucher = async (token, voucherId) => {
  const res = await voucherApi.collectCampaign(token, voucherId);
  return res.data;
};

// ── CUSTOMER: Đổi điểm ────────────────────────────────────────────────────────
export const fetchExchangeableVouchers = async (token) => {
  const res = await voucherApi.getExchangeableVouchers(token);
  return res.data?.data || [];
};

export const exchangeVoucher = async (token, voucherId) => {
  const res = await voucherApi.exchangeVoucher(token, voucherId);
  return res.data;
};

export const fetchCustomerPoints = async (token) => {
  const res = await voucherApi.getCustomerPoints(token);
  return res.data.points;
};
export const sendRetentionVoucher = async (token, voucherId, customerIds) => {
  const res = await voucherApi.sendRetention(token, voucherId, customerIds);
  return res.data;
};