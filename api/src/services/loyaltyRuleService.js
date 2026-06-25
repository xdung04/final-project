// backend/src/services/loyaltyRuleService.js
import db from "../models/index.js";
import { Op } from "sequelize";

class LoyaltyRuleService {
  // Tạo rule mới
async createRule(data) {
  data.is_default = data.is_default ?? false;

  if (!data.is_default && (!data.start_date || !data.end_date)) {
    throw new Error("Ngày bắt đầu và Ngày kết thúc là bắt buộc cho chiến dịch đặc biệt");
  }

  // CHẶN KHI TẠO MỚI: Kiểm tra xem DB đã có quy tắc mặc định nào chưa
  if (data.is_default) {
    const existingDefault = await db.LoyaltyRule.findOne({ where: { is_default: true } });
    if (existingDefault) {
      throw new Error("Hệ thống đã có một quy tắc mặc định rồi. Không thể tạo thêm cái mặc định thứ hai!");
    }
  }

  return await db.LoyaltyRule.create({
    name: data.name?.trim() || (data.is_default ? "Quy tắc mặc định" : "Chiến dịch đặc biệt"),
    money_per_point: data.money_per_point,
    point_multiplier: data.point_multiplier ?? 1.0,
    min_order_amount: data.min_order_amount ?? 0,
    is_default: data.is_default,
    is_active: data.is_active ?? true,
    start_date: data.is_default ? null : data.start_date,
    end_date: data.is_default ? null : data.end_date,
  });
}

  async getAllRules() {
    return await db.LoyaltyRule.findAll({ order: [["createdAt", "DESC"]] });
  }

  async getActiveRules() {
    return await db.LoyaltyRule.findAll({ where: { is_active: true } });
  }

  async getDefaultRule() {
    return await db.LoyaltyRule.findOne({ where: { is_default: true, is_active: true } });
  }

  async getRuleById(id) {
    const rule = await db.LoyaltyRule.findByPk(id);
    if (!rule) throw new Error("Không tìm thấy quy tắc tích điểm");
    return rule;
  }

async updateRule(id, data) {
  const rule = await db.LoyaltyRule.findByPk(id);
  if (!rule) throw new Error("Không tìm thấy quy tắc tích điểm");

  // 1. Kiểm tra validate ngày tháng cho chiến dịch đặc biệt
  if (data.is_default === false && (!data.start_date || !data.end_date)) {
    throw new Error("Ngày bắt đầu và Ngày kết thúc là bắt buộc cho chiến dịch đặc biệt");
  }

  // 2. LOGIC TỰ ĐỘNG BỎ MẶC ĐỊNH CŨ
  if (data.is_default === true && rule.is_default === false) {
    // Tìm và update tất cả quy tắc đang là mặc định thành false
    await db.LoyaltyRule.update(
      { is_default: false },
      { where: { is_default: true, id: { [Op.ne]: id } } }
    );
  } 
  // Ngược lại, nếu quy tắc này đang là mặc định mà user tắt nó đi, 
  // bạn có thể thêm logic kiểm tra để đảm bảo hệ thống không bị trống mặc định (nếu muốn)
  else if (rule.is_default === true && data.is_default === false) {
     // Optional: Kiểm tra xem còn quy tắc nào khác để làm mặc định không?
     // Nếu không muốn cho phép tắt, giữ nguyên logic throw error cũ ở đây.
  }

  // 3. Thực hiện cập nhật quy tắc hiện tại
  return await rule.update({
    name: data.name !== undefined ? data.name?.trim() : rule.name,
    money_per_point: data.money_per_point ?? rule.money_per_point,
    point_multiplier: data.point_multiplier ?? rule.point_multiplier,
    min_order_amount: data.min_order_amount ?? rule.min_order_amount,
    is_default: data.is_default ?? rule.is_default,
    is_active: data.is_active ?? rule.is_active,
    start_date: data.is_default ? null : (data.start_date ?? rule.start_date),
    end_date: data.is_default ? null : (data.end_date ?? rule.end_date),
  });
}

  async deleteRule(id) {
    const rule = await db.LoyaltyRule.findByPk(id);
    if (!rule) throw new Error("Không tìm thấy quy tắc tích điểm");
    
    if (rule.is_default) {
      throw new Error("Không thể xóa quy tắc mặc định của hệ thống");
    }
    
    return await rule.update({ is_active: false });
  }

  // LỖ HỔNG 1: Tìm quy tắc áp dụng chuẩn xác cho hóa đơn cắt tóc
  async getApplicableRule() {
    const now = new Date();
    return await db.LoyaltyRule.findOne({
      where: {
        is_active: true,
        [Op.or]: [
          { is_default: true },
          { 
            is_default: false, 
            start_date: { [Op.lte]: now }, 
            end_date: { [Op.gte]: now } 
          },
        ],
      },
      // Đổi thành ASC để chiến dịch đặc biệt (false = 0) xếp trước quy tắc mặc định (true = 1)
      order: [["is_default", "ASC"], ["createdAt", "DESC"]], 
    });
  }
}

export default new LoyaltyRuleService();