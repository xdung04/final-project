// controllers/summaryController.js
import { getSummary,getAISummary } from "../services/summaryStatisticService.js";

export async function getBranchSummary(req, res) {
  try {
    const branchIdLuong  = parseInt(req.query.branchIdLuong,  10);
    const branchIdRating = parseInt(req.query.branchIdRating, 10);
    const branchIdChart2 = parseInt(req.query.branchIdChart2, 10); // ← thêm dòng này

    const yearLuong    = parseInt(req.query.yearLuong,    10) || new Date().getFullYear();
    const monthLuong   = parseInt(req.query.monthLuong,   10) || new Date().getMonth() + 1;
    const yearChiNhanh = parseInt(req.query.yearChiNhanh, 10) || new Date().getFullYear();

    // Lấy thêm name để AI dùng trong prompt
    const branchNameLuong  = req.query.branchNameLuong  || `Branch ${branchIdLuong}`;
    const branchNameRating = req.query.branchNameRating || `Branch ${branchIdRating}`;
    const branchNameChart2 = req.query.branchNameChart2 || `Branch ${branchIdChart2}`;

    // Validate đủ cả 3
    if (isNaN(branchIdLuong) || isNaN(branchIdRating) || isNaN(branchIdChart2)) {
      return res.status(400).json({
        success: false,
        message: "branchIdLuong, branchIdRating hoặc branchIdChart2 bị thiếu hoặc không hợp lệ",
      });
    }

    const summaryData = await getSummary({
      branchIdLuong,  branchNameLuong,
      branchIdRating, branchNameRating,
      branchIdChart2, branchNameChart2,
      yearLuong,
      monthLuong,
      yearChiNhanh,
    });

    res.json({ success: true, data: summaryData });
  } catch (err) {
    console.error("Error in getBranchSummary:", err);
    res.status(500).json({
      success: false,
      message: "Lấy báo cáo thất bại",
      error: err.message,
    });
  }
}
export async function getAISummaryModel(req, res) {
  try {
    const data = await getAISummary();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("❌ getAISummary:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}