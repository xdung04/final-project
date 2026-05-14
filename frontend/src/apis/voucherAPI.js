import axios from "axios";

const API_URL = process.env.REACT_APP_API_BASE_URL + "/vouchers";

const voucherApi = {
  // ── ADMIN ──────────────────────────────────────────────────────────────────
  getAll: (token) =>
    axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getById: (token, id) =>
    axios.get(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  create: (token, data) =>
    axios.post(API_URL, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  update: (token, id, data) =>
    axios.put(`${API_URL}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  delete: (token, id) =>
    axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ── CUSTOMER: Kho voucher ──────────────────────────────────────────────────
  getMyVouchers: (token) =>
    axios.get(`${API_URL}/customer/available`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getMyVoucherHistory: (token) =>
    axios.get(`${API_URL}/customer/history`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ── CUSTOMER: Campaign ─────────────────────────────────────────────────────
  getActiveCampaigns: (token) =>
    axios.get(`${API_URL}/customer/campaigns`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  collectCampaign: (token, voucherId) =>
    axios.post(
      `${API_URL}/customer/collect`,
      { voucherId },
      { headers: { Authorization: `Bearer ${token}` } },
    ),

  // ── CUSTOMER: Đổi điểm ────────────────────────────────────────────────────
  getExchangeableVouchers: (token) =>
    axios.get(`${API_URL}/customer/exchangeable`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  exchangeVoucher: (token, voucherId) =>
    axios.post(
      `${API_URL}/customer/exchange`,
      { voucherId },
      { headers: { Authorization: `Bearer ${token}` } },
    ),
  getCustomerPoints: (token) =>
    axios.get(`${API_URL}/customer/points`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  sendRetention: (token, voucherId, customerIds) =>
    axios.post(
      `${API_URL}/retention/issue`,
      { voucherId, customerIds },
      { headers: { Authorization: `Bearer ${token}` } },
    ),
};

export default voucherApi;
