import * as salaryService from "../services/salaryService.js";

// ====================== 1. Lấy danh sách lương tổng hợp ======================
export const getSalaryOverview = async (req, res) => {
  try {
    const months = await salaryService.getSalaryOverview();
    return res.status(200).json(months);
  } catch (err) {
    console.error("Lỗi getSalaryOverview:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ====================== 2. Lấy lương realtime cho 1 tháng cụ thể ======================
export const getSalaries = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: "Thiếu thông tin tháng hoặc năm" });
    }

    const salaries = await salaryService.getBarberSalariesOptimized(
      parseInt(month),
      parseInt(year)
    );

    return res.status(200).json(salaries);
  } catch (err) {
    console.error("Lỗi getSalaries:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ====================== 3. Tính lương & Lưu Nháp (Draft) ======================
// (Thay thế cho hàm confirmSalary cũ)
export const createDraftSalaries = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ error: "Thiếu thông tin tháng hoặc năm" });
    }

    await salaryService.createDraftSalaries(parseInt(month), parseInt(year));
    return res.status(200).json({ message: `Đã tạo bản nháp lương tháng ${month}/${year} thành công` });
  } catch (err) {
    console.error("Lỗi createDraftSalaries:", err);
    return res.status(400).json({ error: err.message });
  }
};

// ====================== 4. Gửi Phiếu Lương cho thợ ======================
export const sendPayslip = async (req, res) => {
  try {
    const { idSalary } = req.params;

    if (!idSalary) {
      return res.status(400).json({ error: "Thiếu ID phiếu lương" });
    }

    const result = await salaryService.sendPayslip(idSalary);
    return res.status(200).json({ message: "Đã gửi phiếu lương thành công", data: result });
  } catch (err) {
    console.error("Lỗi sendPayslip:", err);
    return res.status(400).json({ error: err.message });
  }
};

// ====================== 5. Điều chỉnh Khấu trừ ======================
export const adjustSalary = async (req, res) => {
  try {
    const { idSalary } = req.params;
    const { advance, deduction, adjustmentNote } = req.body;

    if (!idSalary) {
      return res.status(400).json({ error: "Thiếu ID phiếu lương" });
    }

    const result = await salaryService.adjustSalary({
      idSalary,
      advance: Number(advance) || 0,
      deduction: Number(deduction) || 0,
      adjustmentNote
    });

    return res.status(200).json({ message: "Đã lưu điều chỉnh thành công", data: result });
  } catch (err) {
    console.error("Lỗi adjustSalary:", err);
    return res.status(400).json({ error: err.message });
  }
};

// ====================== 6. Ép đóng Khiếu Nại (Force-close) ======================
export const forceCloseDispute = async (req, res) => {
  try {
    const { idSalary } = req.params;
    const { reason } = req.body;

    if (!idSalary || !reason) {
      return res.status(400).json({ error: "Thiếu ID phiếu lương hoặc lý do đóng khiếu nại" });
    }

    const result = await salaryService.forceCloseSalaryDispute(idSalary, reason);
    return res.status(200).json({ message: "Đã đóng khiếu nại thành công", data: result });
  } catch (err) {
    console.error("Lỗi forceCloseDispute:", err);
    return res.status(400).json({ error: err.message });
  }
};

// ====================== 7. Thanh toán & Khóa Sổ ======================
export const markAsPaid = async (req, res) => {
  try {
    const { idSalary } = req.params;
    const { paidAmount, paymentProofUrl } = req.body;

    if (!idSalary || paidAmount === undefined) {
      return res.status(400).json({ error: "Thiếu dữ liệu thanh toán" });
    }

    const result = await salaryService.markAsPaid(idSalary, {
      paidAmount: Number(paidAmount),
      paymentProofUrl
    });

    return res.status(200).json({ message: "Đã xác nhận thanh toán & khóa sổ", data: result });
  } catch (err) {
    console.error("Lỗi markAsPaid:", err);
    return res.status(400).json({ error: err.message });
  }
};