import * as salaryService from "../services/salaryService.js";

// ═══════════════════════════════════════════════════════════════════════════
// 1. Lấy danh sách lương (Tự động chọn Real-time hoặc DB)
// ═══════════════════════════════════════════════════════════════════════════
export const getSalaries = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Thiếu thông tin tháng hoặc năm" });
    }

    // Sử dụng hàm getSalariesForDisplay đã refactor trong service
    const result = await salaryService.getSalariesForDisplay(
      parseInt(month),
      parseInt(year)
    );

    return res.status(200).json(result);
  } catch (err) {
    console.error("Lỗi getSalaries:", err);
    return res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. Tính lương & Lưu Nháp (Draft) cho tháng trước
// ═══════════════════════════════════════════════════════════════════════════
export const createDraftSalaries = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ message: "Thiếu thông tin tháng hoặc năm" });
    }

    const result = await salaryService.createDraftSalaries(parseInt(month), parseInt(year));
    return res.status(201).json({ 
      message: `Đã khởi tạo ${result.count} phiếu lương nháp cho tháng ${month}/${year}`,
      success: true 
    });
  } catch (err) {
    console.error("Lỗi createDraftSalaries:", err);
    return res.status(400).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. Gửi Phiếu Lương (Chuyển từ Draft sang Pending)
// ═══════════════════════════════════════════════════════════════════════════
export const sendPayslip = async (req, res) => {
  try {
    const { idSalary } = req.params;

    const result = await salaryService.sendPayslip(idSalary);
    return res.status(200).json({ message: "Đã gửi phiếu lương đến thợ", data: result });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. Điều chỉnh Khấu trừ & Ghi chú
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// 5. Quản lý ép đóng khiếu nại (Force-close)
// ═══════════════════════════════════════════════════════════════════════════
export const forceCloseDispute = async (req, res) => {
  try {
    const { idSalary } = req.params;
    const { reason } = req.body;

    if (!reason) return res.status(400).json({ message: "Cần có lý do bác bỏ khiếu nại" });

    const result = await salaryService.forceCloseSalaryDispute(idSalary, reason);
    return res.status(200).json({ message: "Đã đóng khiếu nại", data: result });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 6. Xác nhận đã trả tiền (Paid)
// ═══════════════════════════════════════════════════════════════════════════
export const markAsPaid = async (req, res) => {
  try {
    const { idSalary } = req.params;
    const { paidAmount, paymentProofUrl } = req.body;

    const result = await salaryService.markAsPaid(idSalary, {
      paidAmount: Number(paidAmount),
      paymentProofUrl
    });

    return res.status(200).json({ message: "Đã xác nhận thanh toán thành công", data: result });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 7. APIs dành riêng cho Barber (Thợ tự xem)
// ═══════════════════════════════════════════════════════════════════════════

export const getMyPayslips = async (req, res) => {
  try {
    // Vì idBarber === idUser nên dùng trực tiếp idUser từ token
    const idBarber = req.user.idUser; 
    const payslips = await salaryService.getMyPayslips(idBarber);
    return res.status(200).json(payslips);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const confirmMyPayslip = async (req, res) => {
  try {
    const { idSalary } = req.params;
    const idBarber = req.user.idUser;

    const result = await salaryService.confirmPayslipByBarber(idSalary, idBarber);
    return res.status(200).json({ message: "Bạn đã xác nhận phiếu lương này", data: result });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const disputeMyPayslip = async (req, res) => {
  try {
    const { idSalary } = req.params;
    const { reason } = req.body;
    const idBarber = req.user.idUser;

    const result = await salaryService.disputePayslipByBarber(idSalary, idBarber, reason);
    return res.status(200).json({ message: "Đã gửi khiếu nại thành công", data: result });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};