import * as request from "~/apis/configs/httpRequest";

const BASE = "/customer-stats";

// Không còn cần token — cookie tự gửi kèm.
//
// LƯU Ý QUAN TRỌNG VỀ FORMAT RESPONSE:
// Trước đây dùng axios gốc, BE trả `{ data: {...} }`, nên phải đọc
// `res.data.data` (2 lớp: 1 lớp axios bọc sẵn + 1 lớp do BE tự đặt tên field
// "data"). Giờ dùng request.get từ httpRequest.js, hàm này đã TỰ BÓC lớp
// axios ra rồi (xem httpRequest.js: get/post/... trả thẳng res.data của
// axios), nên `res` ở đây CHÍNH LÀ `{ data: {...} }` mà BE trả — chỉ còn 1
// lớp `.data` cần bóc, không phải 2 lớp như trước.
export const fetchCustomerOverview = async () => {
  const res = await request.get(`${BASE}/overview`);
  return res?.data || {};
};

export const fetchMonthlyStats = async (months = 6) => {
  const res = await request.get(`${BASE}/monthly?months=${months}`);
  return res?.data || [];
};

export const fetchAtRiskCustomers = async (days = 30, includeWalkIn = true) => {
  const res = await request.get(
    `${BASE}/at-risk?days=${days}&includeWalkIn=${includeWalkIn}`,
  );
  return res?.data || [];
};

// Phân loại khách hàng theo segment
export const fetchCustomerSegments = async () => {
  const res = await request.get(`${BASE}/segments`);
  return res?.data || { summary: {}, segments: {} };
};