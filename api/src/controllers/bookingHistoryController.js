// controllers/bookingHistoryController.js
import BookingHistoryService from "../services/bookingHistoryService.js";

// ================== Lấy lịch sử booking của khách từ token ==================
const getBookingHistory = async (req, res) => {
  try {
    // Lấy idCustomer từ token (giả sử middleware auth đã set req.user)
    const idCustomer = req.user?.idUser;
    if (!idCustomer) return res.status(401).json({ message: "Unauthorized" });

    // 👉 Hứng type và page từ query params do Frontend gửi lên (ví dụ: ?type=upcoming&page=1)
    // Nếu FE không truyền lên thì mặc định sẽ là "upcoming" và trang 1
    const { type = "upcoming", page = 1 } = req.query;

    // Gọi service để lấy lịch sử booking (nhớ truyền thêm type và page vào đây)
    const bookings = await BookingHistoryService.getBookingsByCustomer(idCustomer, type, page);

    // Trả về dữ liệu (Biến bookings lúc này đã bao gồm cả { data, pagination } từ Service)
    res.status(200).json({ success: true, ...bookings });
    
  } catch (error) {
    console.error("Lỗi getBookingHistory:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getBookingHistory,
};