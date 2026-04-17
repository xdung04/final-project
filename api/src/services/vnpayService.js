// services/vnpayService.js
import crypto from "crypto";
import querystring from "qs";
import moment from "moment";

/**
 * Tạo URL thanh toán VNPAY
 * @param {object} data - { idBooking, amount }
 */
export const createPaymentUrl = async (data) => {
  const { idBooking, amount } = data;
  
  const tmnCode = process.env.VNPAY_TMN_CODE;
  const secretKey = process.env.VNPAY_HASH_SECRET;
  const vnpUrl = process.env.VNPAY_URL;
  const returnUrl = process.env.VNPAY_RETURN_URL;

  const date = new Date();
  const createDate = moment(date).format("YYYYMMDDHHmmss");

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: `${idBooking}_${createDate}`, // Mã đơn hàng (duy nhất mỗi lần gọi)
    vnp_OrderInfo: `Thanh toan Barber - Bill ${idBooking}`,
    vnp_OrderType: "other",
    vnp_Amount: amount * 100, // VNPAY tính theo đơn vị đồng (x100)
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: "127.0.0.1", // IP thực tế của khách hoặc lấy từ req
    vnp_CreateDate: createDate,
  };

  // 1. Sắp xếp các tham số theo thứ tự alphabet (Bắt buộc)
  vnp_Params = sortObject(vnp_Params);

  // 2. Tạo chuỗi query
  const signData = querystring.stringify(vnp_Params, { encode: false });

  // 3. Băm SHA512 với Secret Key
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  vnp_Params["vnp_SecureHash"] = signed;

  // 4. Trả về URL cuối cùng
  return `${vnpUrl}?${querystring.stringify(vnp_Params, { encode: false })}`;
};

/**
 * Kiểm tra tính hợp lệ của dữ liệu phản hồi từ VNPAY (Verify Signature)
 * @param {object} query - Toàn bộ req.query nhận được
 */
export const verifyReturnData = (query) => {
  let vnp_Params = { ...query };
  const secureHash = vnp_Params["vnp_SecureHash"];

  // 1. Loại bỏ các tham số không tham gia băm
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  // 2. Sắp xếp tham số (Sử dụng logic chuẩn của VNPAY)
  vnp_Params = sortObject(vnp_Params);

  const secretKey = process.env.VNPAY_HASH_SECRET;
  
  // 3. Stringify: Quan trọng là encode: false vì ta đã xử lý trong sortObject
  const signData = querystring.stringify(vnp_Params, { encode: false });

  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return secureHash === signed;
};

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    // VNPAY yêu cầu: key và value đều phải được encode, khoảng trắng thay bằng dấu +
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}