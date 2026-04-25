import express from "express";
import * as hrPolicyController from "../controllers/hrPolicyController.js";
import { authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Tất cả các route này chỉ dành cho Admin
const adminOnly = authorize(["admin"]);

// ═══════════════════════════════════════════════════════════════════════════
// 1. QUẢN LÝ CẤP BẬC (COMPENSATION PLANS)
// ═══════════════════════════════════════════════════════════════════════════

// Lấy danh sách các cấp bậc đang active
router.get("/plans", adminOnly, hrPolicyController.getAllActivePlans);

// Tạo mới hoặc cập nhật thông tin cấp bậc (roleType, defaultSalary,...)
router.post("/plans", adminOnly, hrPolicyController.savePlan);

// ═══════════════════════════════════════════════════════════════════════════
// 2. QUẢN LÝ QUY TẮC (COMMISSION & BONUS RULES)
// ═══════════════════════════════════════════════════════════════════════════

// Lấy toàn bộ luật hoa hồng và thưởng của 1 cấp bậc cụ thể
router.get("/plans/:idPlan/rules", adminOnly, hrPolicyController.getRulesByPlan);

// Lưu danh sách luật hoa hồng (Gửi mảng rules trong body)
router.post("/plans/:idPlan/commission-rules", adminOnly, hrPolicyController.saveCommissionRules);

// Lưu danh sách luật thưởng KPI (Gửi mảng rules trong body)
router.post("/plans/:idPlan/bonus-rules", adminOnly, hrPolicyController.saveBonusRules);

// ═══════════════════════════════════════════════════════════════════════════
// 3. QUẢN LÝ HỢP ĐỒNG THỢ (CONTRACTS)
// ═══════════════════════════════════════════════════════════════════════════

// Lấy danh sách thợ kèm hợp đồng hiện tại để hiển thị ở Tab 3
router.get("/barbers-contracts", adminOnly, hrPolicyController.getBarbersWithContracts);

// Ký hợp đồng mới cho thợ (Sẽ tự động đóng hợp đồng cũ nếu có)
router.post("/barbers/:idBarber/assign-contract", adminOnly, hrPolicyController.assignContract);
router.put("/contracts/:idContract/update-pending", adminOnly, hrPolicyController.updatePendingContract);

// 🔥 THÊM MỚI: Chấm dứt hợp đồng đang chạy
router.post("/contracts/:idContract/terminate", adminOnly, hrPolicyController.terminateContract);
export default router;