import { getHashtagsService, linkHashtagsToReelService, getTopHashtagsService } from "../services/hashtagService.js";

// Lấy danh sách hashtag gợi ý
export const getHashtags = async (req, res) => {
  try {
    const q = req.query.q || "";
    const tags = await getHashtagsService(q);
    res.json(tags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi lấy danh sách hashtag" });
  }
};

// 🟢 THÊM: Liên kết danh sách hashtag với một Reel cụ thể
export const linkHashtagsToReel = async (req, res) => {
    // Giả sử idReel được truyền qua body (hoặc params tùy route setup)
    const { idReel, hashtags } = req.body; 
    
    if (!idReel || !hashtags || !Array.isArray(hashtags)) {
        return res.status(400).json({ error: "Thiếu idReel hoặc hashtags hợp lệ." });
    }

    try {
        const result = await linkHashtagsToReelService(idReel, hashtags);
        
        res.status(200).json({ 
            message: `Đã liên kết ${result.linkedCount} hashtag thành công.`,
            data: result
        });
    } catch (err) {
        console.error("Lỗi khi liên kết hashtag với reel:", err);
        res.status(500).json({ error: "Lỗi nội bộ khi liên kết hashtag." });
    }
};

export const getTopHashtags = async (req, res) => {
  try {
    const topTags = await getTopHashtagsService();
    res.json(topTags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi lấy top hashtag" });
  }
};