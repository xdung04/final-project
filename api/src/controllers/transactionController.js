import transactionService from "../services/transactionService.js";

/**
 * Lấy toàn bộ danh sách giao dịch thuộc chi nhánh của Lễ tân
 */
const getAllTransactions = async (req, res) => {
  try {
    // 🌟 BẢO MẬT TUYỆT ĐỐI: Lấy trực tiếp idBranch từ Token đã kiểm tra ở Middleware.
    // Lễ tân không thể tự sửa đổi giá trị này từ Client.
    const idBranch = req.user.idBranch;

    if (!idBranch) {
      return res.status(403).json({ 
        success: false,
        message: "Tài khoản của bạn chưa được liên kết với bất kỳ chi nhánh nào." 
      });
    }

    // Ép kiểu dữ liệu nghiêm ngặt đầu vào để chống SQL Injection hoặc ép kiểu lỗi
    const queryParams = {
      idBranch: Number(idBranch),
      search: req.query.search ? String(req.query.search).trim() : undefined,
      dateFrom: req.query.dateFrom ? String(req.query.dateFrom) : undefined,
      dateTo: req.query.dateTo ? String(req.query.dateTo) : undefined,
      statusFilter: req.query.statusFilter ? String(req.query.statusFilter) : "all",
      methodFilter: req.query.methodFilter ? String(req.query.methodFilter) : "all",
      page: Math.max(1, parseInt(req.query.page) || 1),
      limit: Math.max(1, Math.min(50, parseInt(req.query.limit) || 6)) // Giới hạn limit tối đa 50 để chống spam sập DB
    };

    const result = await transactionService.getTransactionsForReceptionist(queryParams);

    return res.status(200).json({
      success: true,
      message: "Tải danh sách giao dịch chi nhánh thành công.",
      ...result
    });

  } catch (error) {
    // Bảo mật: Ghi nhận lỗi chi tiết ở Server log, che giấu lỗi hệ thống khi trả về Client
    console.error(`[Security Log] Lỗi tại getAllTransactions bởi User ${req.user?.idUser}:`, error);
    
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra sự cố hệ thống khi truy xuất dữ liệu tài chính."
    });
  }
};

/**
 * Lấy số liệu thống kê tổng hợp (4 thẻ đầu trang) của chi nhánh
 */
const getSummaryStats = async (req, res) => {
  try {
    const idBranch = req.user.idBranch;

    if (!idBranch) {
      return res.status(403).json({ 
        success: false,
        message: "Không thể thực hiện thống kê dữ liệu. Thiếu thông tin chi nhánh định danh." 
      });
    }

    // Đồng bộ an toàn bộ lọc thông tin
    const filters = {
      dateFrom: req.query.dateFrom ? String(req.query.dateFrom) : undefined,
      dateTo: req.query.dateTo ? String(req.query.dateTo) : undefined,
      search: req.query.search ? String(req.query.search).trim() : undefined,
    };

    const stats = await transactionService.getStatsForReceptionist(Number(idBranch), filters);

    return res.status(200).json({
      success: true,
      message: "Tải số liệu thống kê tài chính thành công.",
      data: stats
    });

  } catch (error) {
    console.error(`[Security Log] Lỗi tại getSummaryStats bởi User ${req.user?.idUser}:`, error);
    return res.status(500).json({
      success: false,
      message: "Không thể tính toán dữ liệu báo cáo vào lúc này."
    });
  }
};

export default {
  getAllTransactions,
  getSummaryStats,
};