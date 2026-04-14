// controllers/summaryController.js
import { getSummary } from "../services/summaryStatisticService.js";

export async function getBranchSummary(req, res) {
  try {
    const branchIdLuong = parseInt(req.query.branchIdLuong, 10);
    const branchIdRating = parseInt(req.query.branchIdRating, 10);
    const yearLuong = parseInt(req.query.yearLuong, 10) || new Date().getFullYear();
    const monthLuong = parseInt(req.query.monthLuong, 10) || new Date().getMonth() + 1;
    const yearChiNhanh = parseInt(req.query.yearChiNhanh, 10) || new Date().getFullYear();

    if (isNaN(branchIdLuong) || isNaN(branchIdRating)) {
      return res.status(400).json({
        success: false,
        message: "branchIdLuong hoặc branchIdRating bị thiếu hoặc không hợp lệ"
      });
    }

    const params = {
      branchIdLuong,
      branchIdRating,
      yearLuong,
      monthLuong,
      yearChiNhanh,
      charts: ["barberRevenue", "branchRevenue", "ratings"]
    };

    const summaryData = await getSummary(params);

    res.json({ success: true, data: summaryData });
  } catch (err) {
    console.error("Error in getBranchSummary:", err);
    res.status(500).json({
      success: false,
      message: "Lấy báo cáo thất bại",
      error: err.message
    });
  }
}
