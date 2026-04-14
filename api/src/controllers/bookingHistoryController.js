// controllers/bookingHistoryController.js
import BookingHistoryService from "../services/bookingHistoryService.js";

// ================== Lấy lịch sử booking của khách từ token ==================
const getBookingHistory = async (req, res) => {
  try {
    // Lấy idCustomer từ token (giả sử middleware auth đã set req.user)
    const idCustomer = req.user?.idUser;
    if (!idCustomer) return res.status(401).json({ message: "Unauthorized" });

    // Gọi service để lấy lịch sử booking
    const bookings = await BookingHistoryService.getBookingsByCustomer(idCustomer);

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("Lỗi getBookingHistory:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getBookingHistory,
};
