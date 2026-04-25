import express from "express";
import * as salaryController from "../controllers/salaryController.js";

const router = express.Router();

// ====================== 1. QUẢN LÝ TỔNG QUAN & DỮ LIỆU GỐC ======================

// Lấy danh sách tháng + trạng thái lương (Overview hiển thị list tháng)
router.get("/overview", salaryController.getSalaryOverview);

// Lấy bảng lương real-time cho một tháng cụ thể (Query: ?month=X&year=Y)
router.get("/", salaryController.getSalaries);


// ====================== 2. WORKFLOW XỬ LÝ LƯƠNG (CÁC API MỚI) ======================

// (Thay thế cho /confirm cũ) - Tạo bản nháp lương cho tháng
router.post("/draft", salaryController.createDraftSalaries);

// Gửi phiếu lương cho thợ (chuyển sang Pending và kích hoạt đếm ngược 48h)
router.post("/:idSalary/send", salaryController.sendPayslip);

// Admin điều chỉnh các khoản phạt/tạm ứng (từ DeductionModal)
router.put("/:idSalary/adjust", salaryController.adjustSalary);

// Admin ép đóng khiếu nại của thợ (từ chối khiếu nại và chốt sổ)
router.post("/:idSalary/force-close", salaryController.forceCloseDispute);

// Xác nhận đã thanh toán lương & Khóa sổ (Paid)
router.post("/:idSalary/pay", salaryController.markAsPaid);
// API cho Thợ cắt tóc
router.get("/my-payslips", verifyToken, salaryController.getMyPayslips);
router.patch("/:idSalary/confirm", verifyToken, salaryController.confirmMyPayslip);
router.patch("/:idSalary/dispute", verifyToken, salaryController.disputeMyPayslip);
export default router;