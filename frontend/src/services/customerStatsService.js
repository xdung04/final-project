import axios from "axios";

const BASE = process.env.REACT_APP_API_BASE_URL + "/customer-stats";

export const fetchCustomerOverview = async (token) => {
  const res = await axios.get(`${BASE}/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.data || {};
};

export const fetchMonthlyStats = async (token, months = 6) => {
  const res = await axios.get(`${BASE}/monthly?months=${months}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.data || [];
};

export const fetchAtRiskCustomers = async (token, days = 30, includeWalkIn = true) => {
  const res = await axios.get(
    `${BASE}/at-risk?days=${days}&includeWalkIn=${includeWalkIn}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data?.data || [];
};

// Phân loại khách hàng theo segment
export const fetchCustomerSegments = async (token) => {
  const res = await axios.get(`${BASE}/segments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.data || { summary: {}, segments: {} };
};