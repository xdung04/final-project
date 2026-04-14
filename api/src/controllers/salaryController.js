import * as salaryService from "../services/salaryService.js";

// ====================== Lấy danh sách lương + trạng thái ======================
export const getSalaryOverview = async (req, res) => {
  try {
    const months = await salaryService.getSalaryOverview();
    return res.status(200).json(months);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ====================== Xác nhận tính lương toàn bộ thợ ======================
export const confirmSalary = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ error: "Thiếu tháng hoặc năm" });
    }

    const result = await salaryService.confirmMonthlySalary(parseInt(month), parseInt(year));

    if (result.success) {
      return res.status(200).json({ message: result.message });
    } else {
      return res.status(400).json({ error: result.message });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ====================== Lấy lương realtime cho 1 tháng cụ thể ======================
export const getSalaries = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: "Thiếu tháng hoặc năm" });
    }

    const salaries = await salaryService.getBarberSalariesOptimized(
      parseInt(month),
      parseInt(year)
    );

    return res.status(200).json(salaries);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
