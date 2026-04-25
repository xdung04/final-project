import express from "express";
import * as salaryController from "../controllers/salaryController.js";
// Import hàm authorize của ông vào đây (sửa lại đường dẫn cho đúng với project của ông nhé)
import { authorize } from "../middlewares/authMiddleware.js"; 

const router = express.Router();

// Tạo sẵn 2 cái biến middleware cho gọn code
const adminOnly = authorize(["admin"]);
// Chỗ này nếu DB của ông gọi thợ là "staff" hoặc "employee" thì ông đổi chữ "barber" lại nhé
const barberOnly = authorize(["barber"]); 


// ====================== 1. QUẢN LÝ TỔNG QUAN (DÀNH CHO ADMIN) ======================

router.get("/overview", adminOnly, salaryController.getSalaryOverview);
router.get("/", adminOnly, salaryController.getSalaries);
router.post("/draft", adminOnly, salaryController.createDraftSalaries);
router.post("/:idSalary/send", adminOnly, salaryController.sendPayslip);
router.put("/:idSalary/adjust", adminOnly, salaryController.adjustSalary);
router.post("/:idSalary/force-close", adminOnly, salaryController.forceCloseDispute);
router.post("/:idSalary/pay", adminOnly, salaryController.markAsPaid);


// ====================== 2. WORKFLOW XỬ LÝ LƯƠNG (DÀNH CHO THỢ) ======================

// Quan trọng: Để api /my-payslips lên TRÊN cùng của cụm động /:idSalary để không bị lỗi nhầm route
router.get("/my-payslips", barberOnly, salaryController.getMyPayslips);

router.patch("/:idSalary/confirm", barberOnly, salaryController.confirmMyPayslip);
router.patch("/:idSalary/dispute", barberOnly, salaryController.disputeMyPayslip);


export default router;