// controllers/statisticsController.js
import * as StatisticsService from "../services/statisticsService.js";

/**
 * Lấy doanh thu tất cả thợ
 * Query params: month, year, branchId
 */
const getBarberRevenue = async (req, res) => {
  try {
    const { month, year, branchId } = req.query;
    const data = await StatisticsService.getBarberRevenue({
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      branchId: branchId ? parseInt(branchId) : undefined,
    });
    return res.status(200).json(data);
  } catch (error) {
    console.error("Lỗi getBarberRevenue:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * Lấy tổng doanh thu từng tháng của các chi nhánh trong năm
 * Query param: year
 */
const getMonthlyBranchRevenue = async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) {
      return res.status(400).json({ message: "Thiếu param year" });
    }
    const data = await StatisticsService.getBranchMonthlyBookingRevenue(parseInt(year));
    return res.status(200).json(data);
  } catch (error) {
    console.error("Lỗi getMonthlyBranchRevenue:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
const getDashboardOverview = async (req, res) => {
  try {
    const { month, year } = req.query;
    const data = await StatisticsService.getStatisticsOverview(
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined
    );
    return res.status(200).json(data);
  } catch (error) {
    console.error("Lỗi getDashboardOverview:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
export default {
  getBarberRevenue,
  getMonthlyBranchRevenue,
  getDashboardOverview,
};
