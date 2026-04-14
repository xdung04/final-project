import ratingService from "../services/ratingService.js";

/**
 * GET /api/ratings/barber/:idBarber
 * Lấy summary đánh giá của 1 thợ
 */
 const getRatingSummaryByBarber = async (req, res) => {
  try {
    const { idBarber } = req.params;
    const summary = await ratingService.getRatingSummaryByBarber(idBarber);
    if (!summary) return res.status(404).json({ message: "Barber rating summary not found" });
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/ratings/barber/:idBarber
 * Cập nhật rating khi có đánh giá mới
 * body: { rate: number }
 */
const updateRating = async (req, res) => {
  try {
    const { idBarber } = req.params;
    const { rate } = req.body;
    if (typeof rate !== "number" || rate < 1 || rate > 5) {
      return res.status(400).json({ message: "Invalid rate value" });
    }

    const summary = await ratingService.updateRating(idBarber, rate);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/ratings/branch/:idBranch
 * Lấy danh sách thợ kèm summary đánh giá theo chi nhánh
 */
 const getAllRatingsByBranch = async (req, res) => {
  try {
    const { idBranch } = req.params;
    const barbers = await ratingService.getAllRatingsByBranch(idBranch);
    res.json(barbers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export default {
  getRatingSummaryByBarber,
  updateRating,
  getAllRatingsByBranch
};