import db from "../models/index.js";
import { Op } from "sequelize";

class BonusRuleService {
  // ================== Tạo rule mới ==================
  async createRule(data) {
    const { minRevenue, bonusPercent, note, active } = data;

    if (minRevenue == null || bonusPercent == null) {
      throw new Error("Vui lòng nhập minRevenue và bonusPercent");
    }

    // Kiểm tra trùng minRevenue
    const existed = await db.BonusRule.findOne({ where: { minRevenue } });
    if (existed) throw new Error("Đã tồn tại mốc doanh thu này!");

    // Lấy rule đang active để kiểm tra logic phần trăm
    const rules = await db.BonusRule.findAll({
      where: { active: true },
      order: [["minRevenue", "ASC"]],
    });

    const prev = rules.filter(r => r.minRevenue < minRevenue).pop();
    const next = rules.find(r => r.minRevenue > minRevenue);

    if (prev && bonusPercent < prev.bonusPercent) {
      throw new Error(`Phần trăm thưởng (${bonusPercent}%) không được thấp hơn mốc trước (${prev.bonusPercent}% cho doanh thu ${prev.minRevenue.toLocaleString("vi-VN")})`);
    }

    if (next && bonusPercent > next.bonusPercent) {
      throw new Error(`Phần trăm thưởng (${bonusPercent}%) không được cao hơn mốc kế tiếp (${next.bonusPercent}% cho doanh thu ${next.minRevenue.toLocaleString("vi-VN")})`);
    }

    return db.BonusRule.create({ minRevenue, bonusPercent, note: note ?? null, active: active ?? true });
  }

  // ================== Lấy rule đang hoạt động ==================
  async getActiveRules() {
    return db.BonusRule.findAll({
      where: { active: true },
      order: [["minRevenue", "ASC"]],
    });
  }

  // ================== Lấy rule theo id ==================
  async getRuleById(id) {
    const rule = await db.BonusRule.findByPk(id);
    if (!rule) throw new Error("Bonus rule not found");
    return rule;
  }

  // ================== Cập nhật rule ==================
  async updateRule(id, data) {
    const rule = await db.BonusRule.findByPk(id);
    if (!rule) throw new Error("Bonus rule not found");

    const { minRevenue, bonusPercent, note, active } = data;

    if (minRevenue && minRevenue !== rule.minRevenue) {
      const existed = await db.BonusRule.findOne({
        where: { minRevenue, id: { [Op.ne]: id } },
      });
      if (existed) throw new Error("Đã tồn tại mốc doanh thu này!");
    }

    const rules = await db.BonusRule.findAll({
      where: { active: true, id: { [Op.ne]: id } },
      order: [["minRevenue", "ASC"]],
    });

    const updatedMin = minRevenue ?? rule.minRevenue;
    const updatedBonus = bonusPercent ?? rule.bonusPercent;
    const prev = rules.filter(r => r.minRevenue < updatedMin).pop();
    const next = rules.find(r => r.minRevenue > updatedMin);

    if (prev && updatedBonus < prev.bonusPercent) {
      throw new Error(`Phần trăm thưởng (${updatedBonus}%) không được thấp hơn mốc trước (${prev.bonusPercent}% cho doanh thu ${prev.minRevenue.toLocaleString("vi-VN")})`);
    }
    if (next && updatedBonus > next.bonusPercent) {
      throw new Error(`Phần trăm thưởng (${updatedBonus}%) không được cao hơn mốc kế tiếp (${next.bonusPercent}% cho doanh thu ${next.minRevenue.toLocaleString("vi-VN")})`);
    }

    return rule.update({
      minRevenue: updatedMin,
      bonusPercent: updatedBonus,
      note: note ?? rule.note,
      active: active ?? rule.active,
    });
  }

  // ================== Xóa (ẩn) rule ==================
  async deleteRule(id) {
    const rule = await db.BonusRule.findByPk(id);
    if (!rule) throw new Error("Bonus rule not found");
    return rule.update({ active: false });
  }

  // ================== Lấy rule phù hợp với doanh thu ==================
  async getApplicableRule(revenue) {
    if (typeof revenue !== "number" || revenue < 0) {
      throw new Error("Invalid revenue");
    }
    return db.BonusRule.findOne({
      where: { active: true, minRevenue: { [Op.lte]: revenue } },
      order: [["minRevenue", "DESC"]],
    });
  }
}

export default new BonusRuleService();
