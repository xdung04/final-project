import * as HrPolicyService from "../services/hrPolicyService.js";

// ==========================================
// 1. QUẢN LÝ CẤP BẬC (COMPENSATION PLANS)
// ==========================================

export const getAllActivePlans = async (req, res) => {
  try {
    const plans = await HrPolicyService.getAllActivePlans();
    return res.status(200).json(plans);
  } catch (error) {
    console.error("Lỗi getAllActivePlans:", error);
    return res.status(500).json({ message: "Lỗi server khi lấy danh sách cấp bậc", error: error.message });
  }
};

export const savePlan = async (req, res) => {
  try {
    const planData = req.body;
    const savedPlan = await HrPolicyService.savePlan(planData);
    return res.status(200).json({
      message: planData.idCompensationPlan ? "Cập nhật cấp bậc thành công" : "Tạo cấp bậc thành công",
      data: savedPlan
    });
  } catch (error) {
    console.error("Lỗi savePlan:", error);
    return res.status(500).json({ message: "Lỗi server khi lưu cấp bậc", error: error.message });
  }
};

// ==========================================
// 2. QUẢN LÝ LUẬT HOA HỒNG & THƯỞNG (RULES)
// ==========================================

export const getRulesByPlan = async (req, res) => {
  try {
    const idCompensationPlan = req.params.idPlan;
    const rules = await HrPolicyService.getRulesByPlan(idCompensationPlan);
    return res.status(200).json(rules);
  } catch (error) {
    console.error("Lỗi getRulesByPlan:", error);
    return res.status(500).json({ message: "Lỗi server khi lấy quy tắc", error: error.message });
  }
};

export const saveCommissionRules = async (req, res) => {
  try {
    const idCompensationPlan = req.params.idPlan;
    const rulesArray = req.body.rules; // Mảng các luật từ frontend gửi lên
    
    await HrPolicyService.saveCommissionRules(idCompensationPlan, rulesArray);
    return res.status(200).json({ message: "Lưu luật hoa hồng thành công" });
  } catch (error) {
    console.error("Lỗi saveCommissionRules:", error);
    return res.status(500).json({ message: "Lỗi server khi lưu luật hoa hồng", error: error.message });
  }
};

export const saveBonusRules = async (req, res) => {
  try {
    const idCompensationPlan = req.params.idPlan;
    const rulesArray = req.body.rules; 
    
    await HrPolicyService.saveBonusRules(idCompensationPlan, rulesArray);
    return res.status(200).json({ message: "Lưu luật thưởng KPI thành công" });
  } catch (error) {
    console.error("Lỗi saveBonusRules:", error);
    return res.status(500).json({ message: "Lỗi server khi lưu luật thưởng KPI", error: error.message });
  }
};

// ==========================================
// 3. QUẢN LÝ HỢP ĐỒNG (CONTRACTS)
// ==========================================

export const getBarbersWithContracts = async (req, res) => {
  try {
    const barbers = await HrPolicyService.getBarbersWithContracts();
    return res.status(200).json(barbers);
  } catch (error) {
    console.error("Lỗi getBarbersWithContracts:", error);
    return res.status(500).json({ message: "Lỗi server khi lấy danh sách hợp đồng thợ", error: error.message });
  }
};

export const assignContract = async (req, res) => {
  try {
    const idBarber = req.params.idBarber;
    const contractData = req.body;
    
    const newContract = await HrPolicyService.assignContract(idBarber, contractData);
    return res.status(201).json({ // Đổi về 201 Created cho chuẩn RESTful
      message: "Cấp/Ký hợp đồng mới thành công",
      data: newContract
    });
  } catch (error) {
    console.error("Lỗi assignContract:", error);
    return res.status(500).json({ message: "Lỗi server khi cấp hợp đồng mới", error: error.message });
  }
};

// 🔥 THÊM MỚI: API Cập nhật hợp đồng nháp
export const updatePendingContract = async (req, res) => {
  try {
    const { idContract } = req.params;
    const updateData = req.body;

    const result = await HrPolicyService.updatePendingContract(idContract, updateData);
    
    return res.status(200).json({
      message: "Cập nhật hợp đồng nháp thành công",
      data: result
    });
  } catch (error) {
    console.error("Lỗi updatePendingContract:", error);
    
    // Nếu dính lỗi logic (hợp đồng đã chạy), trả về 403 Forbidden thay vì 500 lỗi chung chung
    const statusCode = error.message.includes("cấm chỉnh sửa") ? 403 : 500;
    
    return res.status(statusCode).json({ message: error.message });
  }
};

// 🔥 THÊM MỚI: API Chấm dứt hợp đồng
export const terminateContract = async (req, res) => {
  try {
    const { idContract } = req.params;
    
    await HrPolicyService.terminateContract(idContract);
    
    return res.status(200).json({ message: "Đã chấm dứt hợp đồng thành công" });
  } catch (error) {
    console.error("Lỗi terminateContract:", error);
    return res.status(500).json({ message: "Lỗi server khi chấm dứt hợp đồng", error: error.message });
  }
};