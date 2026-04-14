import * as reelService from "../services/reelService.js";

// Lấy tất cả reels
export const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const idUser = req.user?.idUser; // có thể undefined nếu public
    const result = await reelService.getAllReels(page, limit, idUser);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể lấy reels" });
  }
};

export const getReelsByBarberId = async (req, res) => {
  try {
    const { idBarber } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const idUser = req.user?.idUser; // idUser của người đang đăng nhập (optional)

    // Kiểm tra xem idBarber có hợp lệ không
    if (!idBarber) {
      return res.status(400).json({ error: "Thiếu ID Barber" });
    }

    const result = await reelService.getReelsByBarber(idBarber, page, limit, idUser);
    res.json(result);
  } catch (err) {
    console.error(`Lỗi khi lấy reels của Barber ${req.params.idBarber}:`, err);
    res.status(500).json({ error: "Không thể lấy reels của Barber" });
  }
};

// Upload video
export const uploadReel = async (req, res) => {
  try {
    const body = { ...req.body, idBarber: req.user.idUser }; // gắn idBarber từ token
    const newReel = await reelService.uploadReel(body, req.files);
    res.json(newReel);
  } catch (err) {
    console.error("Upload reel lỗi:", err);
    res.status(500).json({ error: err.message || "Upload reel thất bại" });
  }
};

// Chi tiết reel
export const getById = async (req, res) => {
  try {
    const idUser = req.user?.idUser; // optional
    const reel = await reelService.getReelById(req.params.id, idUser);
    if (!reel) return res.status(404).json({ error: "Không tìm thấy reel" });
    res.json(reel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi lấy chi tiết reel" });
  }
};

// Like / Unlike
export const toggleLike = async (req, res) => {
  try {
    const idUser = req.user.idUser;
    const idReel = req.params.id;
    const result = await reelService.toggleLikeReel(idReel, idUser);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi like/unlike" });
  }
};

// Track view
export const trackView = async (req, res) => {
  try {
    const idReel = req.params.id;
    const idUser = req.user.idUser;
    await reelService.trackReelView(idReel, idUser);
    res.status(200).json({ message: "View tracked successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi ghi nhận lượt xem." });
  }
};

// Search reels (public)
export const searchReels = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm." });
    }
    const idUser = req.user?.idUser; 
    const reels = await reelService.searchReelsService(q.trim(), idUser);
    res.json(reels);
  } catch (error) {
    console.error("Lỗi tại searchReels:", error);
    res.status(500).json({ message: "Lỗi server khi tìm kiếm video." });
  }
};