import express from "express";
import loyaltyRulesController from "../controllers/loyaltyRulesController.js";

const router = express.Router();

router.post("/", loyaltyRulesController.createRule);
router.get("/", loyaltyRulesController.getAllRules);
router.get("/active", loyaltyRulesController.getActiveRules);
router.get("/default", loyaltyRulesController.getDefaultRule);
router.get("/applicable", loyaltyRulesController.getApplicableRule);
router.get("/:id", loyaltyRulesController.getRuleById);
router.put("/:id", loyaltyRulesController.updateRule);
router.delete("/:id", loyaltyRulesController.deleteRule);

export default router;
