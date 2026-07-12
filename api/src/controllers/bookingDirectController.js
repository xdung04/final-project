import * as bookingDirectService from "../services/bookingDirectService.js";

/**
 * Tìm khách hàng theo số điện thoại
 * Controller chỉ gọi service, không chứa logic nghiệp vụ
 */
export const findCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ message: "Thiếu số điện thoại!" });
    }

    const result = await bookingDirectService.findCustomerByPhoneService(phone);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in findCustomerByPhone:", error);
    return res.status(500).json({ message: "Lỗi server!" });
  }
};

/**
 * API: Đặt lịch trực tiếp (không cần token)
 * Controller chỉ gọi service, không chứa logic nghiệp vụ
 */
export const createBookingDirect = async (req, res) => {
  try {
    const booking = await bookingDirectService.createBookingDirectService(req.body);

    return res.status(201).json({
      success: true,
      message: "Đặt lịch trực tiếp thành công!",
      data: booking,
    });
  } catch (error) {
    console.error("❌ Lỗi khi tạo booking trực tiếp:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
