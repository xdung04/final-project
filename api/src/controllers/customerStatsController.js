import {
  getMonthlyCustomerStats,
  getCustomerSegments,
} from "../services/customerStatsService.js";

export const monthlyCustomerStats = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const data   = await getMonthlyCustomerStats(months);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Phân loại khách hàng theo segment
export const customerSegments = async (req, res) => {
  try {
    const data = await getCustomerSegments();
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};