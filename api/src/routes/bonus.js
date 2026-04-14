// backend/src/routes/bonusRuleRoutes.js
import express from "express";
import BonusRuleController from "../controllers/bonusController.js";

const router = express.Router();

router.post("/", BonusRuleController.createRule);
router.get("/", BonusRuleController.getActiveRules);
router.get("/applicable", BonusRuleController.getApplicableRule);
router.get("/:id", BonusRuleController.getRuleById);
router.put("/:id", BonusRuleController.updateRule);
router.delete("/:id", BonusRuleController.deleteRule);

export default router;
