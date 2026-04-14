import LoyaltyRuleService from "../services/loyaltyRuleService.js";

// Tạo rule mới
const createRule = async (req, res) => {
  try {
    console.log("Body:", req.body);

    const rule = await LoyaltyRuleService.createRule(req.body);
    console.log("Created rule:", rule);

    res.status(201).json(rule);
  } catch (error) {
    console.error("Lỗi createRule:", error);
    res.status(400).json({ message: error.message });
  }
};

// Lấy tất cả rule
const getAllRules = async (req, res) => {
  try {
    const rules = await LoyaltyRuleService.getAllRules();
    res.status(200).json(rules);
  } catch (error) {
    console.error("Lỗi getAllRules:", error);
    res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả rule active
const getActiveRules = async (req, res) => {
  try {
    const rules = await LoyaltyRuleService.getActiveRules();
    res.status(200).json(rules);
  } catch (error) {
    console.error("Lỗi getActiveRules:", error);
    res.status(500).json({ message: error.message });
  }
};

// Lấy rule mặc định
const getDefaultRule = async (req, res) => {
  try {
    const rule = await LoyaltyRuleService.getDefaultRule();
    res.status(200).json(rule);
  } catch (error) {
    console.error("Lỗi getDefaultRule:", error);
    res.status(500).json({ message: error.message });
  }
};

// Lấy rule theo ID
const getRuleById = async (req, res) => {
  try {
    const rule = await LoyaltyRuleService.getRuleById(req.params.id);
    console.log("Rule from DB:", rule);

    if (!rule) return res.status(404).json({ message: "Rule không tồn tại" });

    res.status(200).json(rule);
  } catch (error) {
    console.error("Lỗi getRuleById:", error);
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật rule
const updateRule = async (req, res) => {
  try {
    console.log("Body:", req.body);

    const rule = await LoyaltyRuleService.updateRule(req.params.id, req.body);
    console.log("Updated rule:", rule);

    res.status(200).json(rule);
  } catch (error) {
    console.error("Lỗi updateRule:", error);
    res.status(400).json({ message: error.message });
  }
};

// Xóa rule (soft delete)
const deleteRule = async (req, res) => {
  try {
    const rule = await LoyaltyRuleService.deleteRule(req.params.id);
    console.log("Deleted rule:", rule);

    res.status(200).json({ message: "Loyalty rule deactivated successfully", rule });
  } catch (error) {
    console.error("Lỗi deleteRule:", error);
    res.status(404).json({ message: error.message });
  }
};

// Lấy rule áp dụng cho khách hiện tại
const getApplicableRule = async (req, res) => {
  try {
    const rule = await LoyaltyRuleService.getApplicableRule();
    res.status(200).json(rule);
  } catch (error) {
    console.error("Lỗi getApplicableRule:", error);
    res.status(500).json({ message: error.message });
  }
};

export default {
  createRule,
  getAllRules,
  getActiveRules,
  getDefaultRule,
  getRuleById,
  updateRule,
  deleteRule,
  getApplicableRule,
};
