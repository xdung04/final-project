import express from "express";
import * as hrPolicyController from "../controllers/hrPolicyController.js";
import { authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();
const adminOnly = authorize(["admin"]);

// ═══════════════════════════════════════════════════════════════════════════
// 1. COMPENSATION PLANS
// ═══════════════════════════════════════════════════════════════════════════
router.get   ("/plans",              adminOnly, hrPolicyController.getAllActivePlans);
router.post  ("/plans",              adminOnly, hrPolicyController.savePlan);
router.delete("/plans/:idPlan",      adminOnly, hrPolicyController.deletePlan);
router.post  ("/plans/:idPlan/clone",adminOnly, hrPolicyController.clonePlan);

// ═══════════════════════════════════════════════════════════════════════════
// 2. RULES
// ═══════════════════════════════════════════════════════════════════════════
router.get ("/plans/:idPlan/rules",            adminOnly, hrPolicyController.getRulesByPlan);
router.post("/plans/:idPlan/commission-rules", adminOnly, hrPolicyController.saveCommissionRules);
router.post("/plans/:idPlan/bonus-rules",      adminOnly, hrPolicyController.saveBonusRules);

// ═══════════════════════════════════════════════════════════════════════════
// 3. CONTRACTS
// ═══════════════════════════════════════════════════════════════════════════
router.get ("/barbers-contracts",                        adminOnly, hrPolicyController.getBarbersWithContracts);
router.post("/barbers/:idBarber/assign-contract",        adminOnly, hrPolicyController.assignContract);
router.put ("/contracts/:idContract/update-pending",     adminOnly, hrPolicyController.updatePendingContract);

// ── MỚI ──────────────────────────────────────────────────────────────────
// BE: route
router.delete("/contracts/:idContract/pending", adminOnly, hrPolicyController.cancelPendingContract);
router.post  ("/contracts/:idContract/preview-end-date", adminOnly, hrPolicyController.previewEndDate);
router.post  ("/contracts/:idContract/set-end-date",     adminOnly, hrPolicyController.setEndDate);
router.delete("/contracts/:idContract/end-date",         adminOnly, hrPolicyController.cancelEndDate);
router.post  ("/contracts/:idContract/promote",          adminOnly, hrPolicyController.promoteBarber);
router.post  ("/contracts/:idContract/settle",           adminOnly, hrPolicyController.settleContract);

// ── XÓA ──────────────────────────────────────────────────────────────────
// ❌ router.post("/contracts/:idContract/terminate") — đã thay bằng /settle
// BE: route
router.get("/promotion-alerts", adminOnly, hrPolicyController.getPromotionAlerts);

export default router;