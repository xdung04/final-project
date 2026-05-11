import * as HrPolicyService from "../services/hrPolicyService.js";
import * as SalaryService from "../services/salaryService.js"; 
// ═══════════════════════════════════════════════════════════════════════════
// 1. COMPENSATION PLANS
// ═══════════════════════════════════════════════════════════════════════════

export const getAllActivePlans = async (req, res) => {
  try {
    const plans = await HrPolicyService.getAllActivePlans();
    return res.status(200).json({ success: true, data: plans });
  } catch (error) {
    console.error("Lỗi getAllActivePlans:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const savePlan = async (req, res) => {
  try {
    const savedPlan = await HrPolicyService.savePlan(req.body);
    return res.status(200).json({
      success: true,
      message: req.body.idCompensationPlan ? "Cập nhật cấp bậc thành công" : "Tạo cấp bậc thành công",
      data: savedPlan,
    });
  } catch (error) {
    console.error("Lỗi savePlan:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePlan = async (req, res) => {
  try {
    await HrPolicyService.deletePlan(req.params.idPlan);
    return res.status(200).json({ success: true, message: "Đã xóa cấp bậc thành công" });
  } catch (error) {
    console.error("Lỗi deletePlan:", error);
    const status = error.message.includes("Đang có thợ") ? 409 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

export const clonePlan = async (req, res) => {
  try {
    const newPlan = await HrPolicyService.clonePlan(req.params.idPlan);
    return res.status(201).json({
      success: true,
      message: "Đã tạo bản sao Plan thành công.",
      data: newPlan,
    });
  } catch (error) {
    console.error("Lỗi clonePlan:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. COMMISSION & BONUS RULES
// ═══════════════════════════════════════════════════════════════════════════

export const getRulesByPlan = async (req, res) => {
  try {
    const rules = await HrPolicyService.getRulesByPlan(req.params.idPlan);
    return res.status(200).json({ success: true, data: rules });
  } catch (error) {
    console.error("Lỗi getRulesByPlan:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const saveCommissionRules = async (req, res) => {
  try {
    await HrPolicyService.saveCommissionRules(req.params.idPlan, req.body.rules);
    return res.status(200).json({ success: true, message: "Lưu luật hoa hồng thành công" });
  } catch (error) {
    console.error("Lỗi saveCommissionRules:", error);
    const status = error.message.includes("đã được dùng để tính lương") ? 409 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

export const saveBonusRules = async (req, res) => {
  try {
    await HrPolicyService.saveBonusRules(req.params.idPlan, req.body.rules);
    return res.status(200).json({ success: true, message: "Lưu luật thưởng KPI thành công" });
  } catch (error) {
    console.error("Lỗi saveBonusRules:", error);
    const status = error.message.includes("đã được dùng để tính lương") ? 409 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. CONTRACTS
// ═══════════════════════════════════════════════════════════════════════════

export const getBarbersWithContracts = async (req, res) => {
  try {
    const barbers = await HrPolicyService.getBarbersWithContracts();
    return res.status(200).json({ success: true, data: barbers });
  } catch (error) {
    console.error("Lỗi getBarbersWithContracts:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const assignContract = async (req, res) => {
  try {
    const newContract = await HrPolicyService.assignContract(req.params.idBarber, req.body);
    return res.status(201).json({
      success: true,
      message: "Ký hợp đồng mới thành công",
      data: newContract,
    });
  } catch (error) {
    console.error("Lỗi assignContract:", error);
    const status = error.message.includes("đã có hợp đồng") ? 409 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

export const updatePendingContract = async (req, res) => {
  try {
    const result = await HrPolicyService.updatePendingContract(req.params.idContract, req.body);
    return res.status(200).json({
      success: true,
      message: "Cập nhật hợp đồng thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi updatePendingContract:", error);
    const status = error.message.includes("không được chỉnh sửa") ? 403 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

// ── MỚI: Preview booking bị ảnh hưởng trước khi set endDate ─────────────
export const previewEndDate = async (req, res) => {
  try {
    const { idContract } = req.params;
    const { endDate } = req.body;

    if (!endDate) {
      return res.status(400).json({ success: false, message: "endDate là bắt buộc" });
    }

    const preview = await HrPolicyService.previewEndDate(idContract, endDate);
    return res.status(200).json({ success: true, data: preview });
  } catch (error) {
    console.error("Lỗi previewEndDate:", error);
    const status = error.message.includes("không tìm thấy") ? 404 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

// ── MỚI: Xác nhận set endDate + hủy booking ─────────────────────────────
export const setEndDate = async (req, res) => {
  try {
    const { idContract } = req.params;
    const { endDate } = req.body;

    if (!endDate) {
      return res.status(400).json({ success: false, message: "endDate là bắt buộc" });
    }

    const result = await HrPolicyService.confirmSetEndDate(idContract, endDate);
    return res.status(200).json({
      success: true,
      message: `Đã thiết lập ngày nghỉ ${endDate}. Đã hủy ${result.cancelledCount} booking.`,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi setEndDate:", error);
    const status = error.message.includes("không tìm thấy") ? 404
                 : error.message.includes("đã có ngày kết thúc") ? 409
                 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

// ── MỚI: Hủy ngày nghỉ ───────────────────────────────────────────────────
export const cancelEndDate = async (req, res) => {
  try {
    const result = await HrPolicyService.cancelEndDate(req.params.idContract);
    return res.status(200).json({
      success: true,
      message: "Đã hủy ngày nghỉ thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi cancelEndDate:", error);
    const status = error.message.includes("không tìm thấy") ? 404 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

// ── MỚI: Lên cấp ─────────────────────────────────────────────────────────
export const promoteBarber = async (req, res) => {
  try {
    const { idContract } = req.params;
    const { idCompensationPlan, actualBaseSalary, salaryPeriod } = req.body;
    // salaryPeriod = { month, year } — kỳ lương vừa confirm

    if (!idCompensationPlan || !actualBaseSalary || !salaryPeriod?.month || !salaryPeriod?.year) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin: idCompensationPlan, actualBaseSalary, salaryPeriod",
      });
    }

    // Lấy idBarber từ contract
    const contract = await HrPolicyService.getContractById(idContract);
    if (!contract) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hợp đồng" });
    }

    const newContract = await HrPolicyService.promoteBarber(
      contract.idBarber,
      { idCompensationPlan, actualBaseSalary },
      salaryPeriod
    );

    return res.status(201).json({
      success: true,
      message: "Lên cấp thành công",
      data: newContract,
    });
  } catch (error) {
    console.error("Lỗi promoteBarber:", error);
    const status = error.message.includes("không tìm thấy") ? 404
                 : error.message.includes("ngày nghỉ") ? 409
                 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

// ── MỚI: Quyết toán & Chấm dứt ───────────────────────────────────────────
export const settleContract = async (req, res) => {
  try {
    const { idContract } = req.params;
    const { deductions } = req.body;
    // deductions = [{ amount, reason, violationDate }] — có thể rỗng []

    const result = await HrPolicyService.calculateSettlement(idContract, deductions || []);
    return res.status(200).json({
      success: true,
      message: "Quyết toán & chấm dứt hợp đồng thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi settleContract:", error);
    const status = error.message.includes("không tìm thấy") ? 404
                 : error.message.includes("chưa có endDate") ? 400
                 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};
// BE: hrPolicyController.js
export const getPromotionAlerts = async (req, res) => {
  try {
    const alerts = await HrPolicyService.getPromotionAlerts();
    return res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// BE: controller
export const cancelPendingContract = async (req, res) => {
  try {
    await HrPolicyService.cancelPendingContract(req.params.idContract);
    return res.status(200).json({ success: true, message: "Đã hủy hợp đồng chờ hiệu lực." });
  } catch (error) {
    const status = error.message.includes("đã có hiệu lực") ? 403 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};