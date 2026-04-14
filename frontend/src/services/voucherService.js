import * as request from "~/apis/configs/httpRequest";

// --- Voucher CRUD ---
export const createVoucher = async (voucherData) => {
  if (!voucherData.title || !voucherData.discountPercent || !voucherData.pointCost || !voucherData.expiryDate) {
    throw new Error("Missing required voucher fields");
  }
  const res = await request.post("/vouchers", voucherData);
  return res;
};

export const getAllVouchers = async () => {
  const res = await request.get("/vouchers");
  return res;
};

export const getVoucherById = async (idVoucher) => {
  const res = await request.get(`/vouchers/${idVoucher}`);
  return res;
};

export const updateVoucher = async (idVoucher, updateData) => {
  const res = await request.put(`/vouchers/${idVoucher}`, updateData);
  return res;
};

export const deleteVoucher = async (idVoucher) => {
  const res = await request.del(`/vouchers/${idVoucher}`);
  return res;
};

// --- Voucher liên quan khách hàng ---
export const getCustomerVouchers = async () => {
  const res = await request.get(`/vouchers/customer/me`);
 return res.data || []; 
};

export const getAvailableVouchersByPoint = async () => {
  const res = await request.get(`/vouchers/available`);
  return res.data || []; 
};

export const exchangeVoucher = async (idVoucher) => {
  const res = await request.post(`/vouchers/exchange`, { idVoucher });
  return res;
};
