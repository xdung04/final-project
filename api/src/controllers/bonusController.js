import BonusRuleService from "../services/bonusService.js";

// Tạo rule mới
export const createRule = async (req, res) => {
  try {
    const rule = await BonusRuleService.createRule(req.body);
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy danh sách rule đang hoạt động
export const getActiveRules = async (req, res) => {
  try {
    const rules = await BonusRuleService.getActiveRules();
    res.status(200).json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy rule theo ID
export const getRuleById = async (req, res) => {
  try {
    const rule = await BonusRuleService.getRuleById(req.params.id);
    res.status(200).json(rule);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Cập nhật rule
export const updateRule = async (req, res) => {
  try {
    const rule = await BonusRuleService.updateRule(req.params.id, req.body);
    res.status(200).json(rule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa (ẩn) rule
export const deleteRule = async (req, res) => {
  try {
    const rule = await BonusRuleService.deleteRule(req.params.id);
    res.status(200).json({ message: "Đã vô hiệu hóa bonus rule", rule });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Lấy rule phù hợp với doanh thu
export const getApplicableRule = async (req, res) => {
  try {
    const revenue = parseFloat(req.query.revenue);
    if (isNaN(revenue)) return res.status(400).json({ message: "Thiếu hoặc không hợp lệ tham số revenue" });

    const rule = await BonusRuleService.getApplicableRule(revenue);
    if (!rule) return res.status(404).json({ message: "Không tìm thấy rule phù hợp" });

    res.status(200).json(rule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ở cuối file
export default {
  createRule,
  getActiveRules,
  getRuleById,
  updateRule,
  deleteRule,
  getApplicableRule,
};
