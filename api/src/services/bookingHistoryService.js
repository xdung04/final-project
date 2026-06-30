import db from "../models/index.js";
import { Op } from "sequelize";

class BookingHistoryService {
  // 👉 Nhận đầy đủ 3 tham số: idCustomer, type, page từ Controller truyền sang
  async getBookingsByCustomer(idCustomer, type = "upcoming", page = 1) {
    const limit = 10; // Số lượng bản ghi hiển thị trên 1 trang
    const offset = (page - 1) * limit; // Vị trí bắt đầu lấy dữ liệu

    // 1. Phân loại điều kiện status dựa trên tab (type) mà khách bấm ở Frontend
    let statusFilter = [];
    if (type === "upcoming") {
      // Tab sắp tới: Lấy các lịch đang chờ duyệt hoặc đã xác nhận
      statusFilter = ["Pending", "Confirmed"];
    } else if (type === "completed") {
      // Tab đã hoàn thành: Chỉ lấy lịch đã cắt xong
      statusFilter = ["Completed"];
    } else {
      // Dự phòng trường hợp có thêm các tab khác (ví dụ: "Canceled")
      statusFilter = [type];
    }

    // 2. Query trực tiếp trong Database kèm điều kiện lọc và giới hạn số lượng
    const { count, rows: bookings } = await db.Booking.findAndCountAll({
      where: { 
        idCustomer,
        status: { [Op.in]: statusFilter } // 🔥 QUAN TRỌNG: Lọc đúng status ở đây để 2 tab không bị trùng nhau
      },
      include: [
        {
          model: db.Barber,
          as: "barber",
          include: [
            {
              model: db.User,
              as: "user",
              attributes: ["fullName", "image"]
            },
            {
              model: db.Branch,
              as: "branch",
              attributes: ["name", "address"]
            }
          ]
        },
        {
          model: db.BookingDetail,
          as: "BookingDetails",
          include: [
            {
              model: db.Service,
              as: "service",
              attributes: ["name"]
            }
          ]
        }
      ],
      order: [["bookingDate", "DESC"]], // Sắp xếp lịch hẹn mới nhất lên đầu
      limit: limit,   
      offset: offset, 
      distinct: true, // Tránh lỗi Sequelize đếm trùng (count) khi dùng kèm HasMany (BookingDetails)
    });

    // 3. Định dạng lại cấu trúc dữ liệu trả về giống hệt form cũ của bạn
    const formattedBookings = bookings.map((b) => ({
      idBooking: b.idBooking,
      date: b.bookingDate ? b.bookingDate.toISOString().split("T")[0] : "",
      time: b.bookingTime,
      barber: {
        name: b.barber?.user?.fullName || "N/A",
        avatar: b.barber?.user?.image || "https://via.placeholder.com/60",
      },
      branch: {
        name: b.barber?.branch?.name || "N/A",
        address: b.barber?.branch?.address || "N/A",
      },
      service: b.BookingDetails ? b.BookingDetails.map(d => d.service?.name).join(" + ") : "",
      total: parseFloat(b.total || 0),
      status: b.status.toUpperCase(), // Giữ nguyên hàm fix chữ in hoa của bạn
    }));

    // 4. Trả về object chứa mảng dữ liệu sạch và thông tin phân trang
    return {
      data: formattedBookings,
      pagination: {
        totalItems: count,                     // Tổng số lịch hẹn có trong tab này
        totalPages: Math.ceil(count / limit),  // Tính toán tổng số trang
        currentPage: parseInt(page),           // Trang hiện tại
        pageSize: limit                        // Số lượng item mỗi trang (10)
      }
    };
  }
}

export default new BookingHistoryService();