// backend/src/services/loyaltyRuleService.js
import db from "../models/index.js";
import { Op } from "sequelize";

class LoyaltyRuleService {
  // Tạo rule mới
  async createRule(data) {
    data.is_default = data.is_default ?? false;

    if (!data.is_default && (!data.start_date || !data.end_date)) {
      throw new Error("Start Date và End Date là bắt buộc cho rule không mặc định");
    }

    if (data.is_default) {
      await db.LoyaltyRule.update(
        { is_default: false },
        { where: { is_default: true } }
      );
    }

    return await db.LoyaltyRule.create({
      money_per_point: data.money_per_point,
      point_multiplier: data.point_multiplier ?? 1.0,
      min_order_amount: data.min_order_amount ?? 0,
      is_default: data.is_default,
      is_active: data.is_active ?? true,
      start_date: data.start_date ?? null,
      end_date: data.end_date ?? null,
    });
  }

  async getAllRules() {
    return await db.LoyaltyRule.findAll();
  }

  async getActiveRules() {
    return await db.LoyaltyRule.findAll({ where: { is_active: true } });
  }

  async getDefaultRule() {
    return await db.LoyaltyRule.findOne({ where: { is_default: true, is_active: true } });
  }

  async getRuleById(id) {
    const rule = await db.LoyaltyRule.findByPk(id);
    if (!rule) throw new Error("Loyalty rule not found");
    return rule;
  }

  async updateRule(id, data) {
    const rule = await db.LoyaltyRule.findByPk(id);
    if (!rule) throw new Error("Loyalty rule not found");

    if (data.is_default === false && (!data.start_date || !data.end_date)) {
      throw new Error("Start Date và End Date là bắt buộc cho rule không mặc định");
    }

    if (data.is_default === true) {
      await db.LoyaltyRule.update(
        { is_default: false },
        { where: { is_default: true, id: { [Op.ne]: id } } }
      );
    }

    return await rule.update({
      money_per_point: data.money_per_point ?? rule.money_per_point,
      point_multiplier: data.point_multiplier ?? rule.point_multiplier,
      min_order_amount: data.min_order_amount ?? rule.min_order_amount,
      is_default: data.is_default ?? rule.is_default,
      is_active: data.is_active ?? rule.is_active,
      start_date: data.start_date ?? rule.start_date,
      end_date: data.end_date ?? rule.end_date,
    });
  }

  async deleteRule(id) {
    const rule = await db.LoyaltyRule.findByPk(id);
    if (!rule) throw new Error("Loyalty rule not found");
    return await rule.update({ is_active: false });
  }

  async getApplicableRule() {
    const now = new Date();
    return await db.LoyaltyRule.findOne({
      where: {
        is_active: true,
        [Op.or]: [
          { is_default: true },
          { is_default: false, start_date: { [Op.lte]: now }, end_date: { [Op.gte]: now } },
        ],
      },
      order: [["is_default", "DESC"]],
    });
  }
}

export default new LoyaltyRuleService();
