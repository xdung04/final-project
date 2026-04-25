import express from "express";
import * as salaryController from "../controllers/salaryController.js";
import { authorize } from "../middlewares/authMiddleware.js"; // Giả sử ông có verifyToken

const router = express.Router();

// Tất cả các route về lương đều cần đăng nhập
router.use(verifyToken);

// Định nghĩa các quyền
const adminOnly = authorize(["admin"]);
const barberOnly = authorize(["barber"]);

// ═══════════════════════════════════════════════════════════════════════════
// 1. QUẢN LÝ TỔNG QUAN & ADMIN ACTIONS
// ═══════════════════════════════════════════════════════════════════════════

// Lấy danh sách lương (Hàm getSalaries trong controller xử lý cả Real-time & DB)
router.get("/", adminOnly, salaryController.getSalaries);

// Tạo bản nháp lương cho tháng đã qua
router.post("/draft", adminOnly, salaryController.createDraftSalaries);

// Gửi phiếu lương cho thợ (Draft -> Pending)
router.post("/:idSalary/send", adminOnly, salaryController.sendPayslip);

// Điều chỉnh khấu trừ và ghi chú
router.put("/:idSalary/adjust", adminOnly, salaryController.adjustSalary);

// Admin ép đóng khiếu nại nếu thợ khiếu nại vô lý
router.post("/:idSalary/force-close", adminOnly, salaryController.forceCloseDispute);

// Xác nhận đã trả tiền và khóa sổ (Confirmed -> Paid)
router.post("/:idSalary/pay", adminOnly, salaryController.markAsPaid);


// ═══════════════════════════════════════════════════════════════════════════
// 2. WORKFLOW DÀNH CHO THỢ (BARBER)
// ═══════════════════════════════════════════════════════════════════════════

/** * LƯU Ý CỰC KỲ QUAN TRỌNG: 
 * Route "/my-payslips" phải nằm TRÊN các route có ":idSalary".
 * Nếu không, Express sẽ hiểu lầm "my-payslips" là một cái "idSalary" và chạy sai hàm.
 */
router.get("/my-payslips", barberOnly, salaryController.getMyPayslips);

// Thợ xác nhận hoặc khiếu nại phiếu lương
router.patch("/:idSalary/confirm", barberOnly, salaryController.confirmMyPayslip);
router.patch("/:idSalary/dispute", barberOnly, salaryController.disputeMyPayslip);

export default router;