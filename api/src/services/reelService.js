import db from "../models/index.js";
import sequelize from "sequelize"; 
import Fuse from "fuse.js"; // 🚀 Thêm Fuse
import { getHashtagsService, linkHashtagsToReelService } from "./hashtagService.js";

const { Reel, ReelLike, ReelComment, ReelView, Barber, User, Sequelize } = db;

// --- Biến cache cho Fuse ---
let fuse = null;
let fuseData = [];


export const trackReelView = async (idReel, idUser) => {
  if (!idUser) return;
  try {
    const [view, created] = await ReelView.upsert(
      { idReel, idUser, lastViewedAt: new Date() },
      { where: { idReel, idUser } }
    );

    if (created) {
      console.log(`[ReelView] Reel ${idReel} recorded first view by User ${idUser}.`);
    } else {
      console.log(`[ReelView] Reel ${idReel} updated view time for User ${idUser}.`);
    }
  } catch (error) {
    console.error("Error tracking persistent reel view:", error);
    throw new Error("Could not track reel view.");
  }
};

export const getAllReels = async (page = 1, limit = 10, idUser) => {
  const reels = await Reel.findAll({
    offset: (page - 1) * limit,
    limit: parseInt(limit),
    order: [["createdAt", "DESC"]],
    attributes: {
      include: [
        [
          sequelize.literal(`(
            SELECT COUNT(DISTINCT rv.idUser)
            FROM reel_views AS rv
            WHERE rv.idReel = Reel.idReel
          )`),
          "viewCount",
        ],
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM reel_likes AS rl
            WHERE rl.idReel = Reel.idReel
          )`),
          "likesCount",
        ],
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM reel_comments AS rc
            WHERE rc.idReel = Reel.idReel
          )`),
          "commentsCount",
        ],
      ],
    },
    include: [
      {
        model: Barber,
        required: true,
        attributes: ["idBarber"],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["fullName", "image"],
            required: true,
          },
        ],
      },
      { model: ReelLike, as: "ReelLikes", attributes: ["idUser"], required: false },
      { model: ReelComment, as: "ReelComments", attributes: ["idComment"], required: false },
    ],
  });

  return reels.map((r) => {
    const plain = r.get({ plain: true });
    return {
      ...plain,
      viewCount: parseInt(plain.viewCount) || 0,
      likesCount: parseInt(plain.likesCount) || 0,
      commentsCount: parseInt(plain.commentsCount) || 0,
      isLiked: idUser
        ? plain.ReelLikes?.some((like) => like.idUser == idUser)
        : false,
    };
  });
};

export const getReelsByBarber = async (idBarber, page = 1, limit = 10, idUser) => {
  const reels = await Reel.findAll({
    where: { idBarber: idBarber }, // Lọc theo idBarber
    offset: (page - 1) * limit,
    limit: parseInt(limit),
    order: [["createdAt", "DESC"]],
    attributes: {
      // Giữ nguyên các thuộc tính viewCount, likesCount, commentsCount
      include: [
        [
          sequelize.literal(`(
            SELECT COUNT(DISTINCT rv.idUser)
            FROM reel_views AS rv
            WHERE rv.idReel = Reel.idReel
          )`),
          "viewCount",
        ],
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM reel_likes AS rl
            WHERE rl.idReel = Reel.idReel
          )`),
          "likesCount",
        ],
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM reel_comments AS rc
            WHERE rc.idReel = Reel.idReel
          )`),
          "commentsCount",
        ],
      ],
    },
    include: [
      {
        model: Barber,
        required: true,
        attributes: ["idBarber"],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["fullName", "image"],
            required: true,
          },
        ],
      },
      // Vẫn lấy thông tin like để kiểm tra isLiked
      { model: ReelLike, as: "ReelLikes", attributes: ["idUser"], required: false },
      { model: ReelComment, as: "ReelComments", attributes: ["idComment"], required: false },
    ],
  });

  return reels.map((r) => {
    const plain = r.get({ plain: true });
    // Logic kiểm tra isLiked dựa trên idUser (có thể null nếu chưa đăng nhập)
    return {
      ...plain,
      viewCount: parseInt(plain.viewCount) || 0,
      likesCount: parseInt(plain.likesCount) || 0,
      commentsCount: parseInt(plain.commentsCount) || 0,
      isLiked: idUser
        ? plain.ReelLikes?.some((like) => like.idUser == idUser)
        : false,
    };
  });
};

// --- Upload video ---
export const uploadReel = async (body, files) => {
  const { title, description, idBarber, hashtags } = body;

  const videoFile = files["video"]?.[0];
  const thumbnailFile = files["thumbnail"]?.[0];
  if (!videoFile) throw new Error("Cần upload video");

  let thumbnailUrl;
  if (thumbnailFile) {
    thumbnailUrl = thumbnailFile.path;
  } else {
    thumbnailUrl = videoFile.path
      .replace("/upload/", "/upload/so_1/")
      .replace(/\.mp4$/, ".jpg");
  }

  const reel = await db.Reel.create({
    idBarber,
    title,
    description,
    url: videoFile.path,
    thumbnail: thumbnailUrl,
  });

  try {
    // 1. Parse Hashtags
    const parsedHashtags = typeof hashtags === "string" ? JSON.parse(hashtags) : hashtags;
    
    if (Array.isArray(parsedHashtags) && parsedHashtags.length > 0) {
      await linkHashtagsToReelService(reel.idReel, parsedHashtags);
    }
  } catch (e) {
    console.warn(`Không thể lưu hashtags cho Reel ${reel.idReel}:`, e.message);
  }

  fuse = null;
  fuseData = [];

  return reel;
};

// --- Chi tiết 1 reel ---
export const getReelById = async (id, idUser) => {
  const reel = await Reel.findByPk(id, {
    attributes: [
      "idReel",
      "idBarber",
      "title",
      "url",
      "thumbnail",
      "description",
      "createdAt",
      [sequelize.fn("COUNT", sequelize.col("ReelViews.idUser")), "viewCount"],
    ],
    group: [
      "Reel.idReel",
      "ReelLikes.idUser",
      "ReelLikes.idLike",
      "ReelComments.idComment",
    ],
    include: [
      { model: ReelComment, as: "ReelComments", required: false },
      { model: ReelLike, as: "ReelLikes", attributes: ["idUser"], required: false },
      { model: ReelView, as: "ReelViews", attributes: [], required: false },
    ],
  });

  if (!reel) return null;
  const plain = reel.get({ plain: true });

  return {
    ...plain,
    viewCount: parseInt(plain.viewCount) || 0,
    likesCount: plain.ReelLikes.length,
    commentsCount: plain.ReelComments.length,
    isLiked: idUser
      ? plain.ReelLikes.some((like) => like.idUser == idUser)
      : false,
  };
};

// --- Like / Unlike ---
export const toggleLikeReel = async (idReel, idUser) => {
  const existing = await ReelLike.findOne({ where: { idReel, idUser } });
  if (existing) {
    await existing.destroy();
  } else {
    await ReelLike.create({ idReel, idUser });
  }

  const count = await ReelLike.count({ where: { idReel } });
  return { liked: !existing, likesCount: count };
};


export const searchReelsService = async (query, idUser) => {
  const keyword = query?.trim()?.toLowerCase();
  if (!keyword) return [];

  // Nếu cache chưa có thì load từ DB
  if (!fuse) {
    console.log("🔄 Khởi tạo Fuse cache...");

    const reels = await Reel.findAll({
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(DISTINCT rv.idUser)
              FROM reel_views AS rv
              WHERE rv.idReel = Reel.idReel
            )`),
            "viewCount",
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM reel_likes AS rl
              WHERE rl.idReel = Reel.idReel
            )`),
            "likesCount",
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM reel_comments AS rc
              WHERE rc.idReel = Reel.idReel
            )`),
            "commentsCount",
          ],
        ],
      },
      include: [
        {
          model: Barber,
          required: true,
          attributes: ["idBarber"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["fullName", "image"],
              required: true,
            },
          ],
        },
        { model: ReelLike, as: "ReelLikes", attributes: ["idUser"], required: false },
      ],
      order: [["createdAt", "DESC"]],
    });

    fuseData = reels.map((r) => {
      const plain = r.get({ plain: true });
      return {
        ...plain,
        viewCount: parseInt(plain.viewCount) || 0,
        likesCount: parseInt(plain.likesCount) || 0,
        commentsCount: parseInt(plain.commentsCount) || 0,
        isLiked: idUser ? plain.ReelLikes?.some((like) => like.idUser == idUser) : false,
      };
    });

    // ⚙️ Cấu hình Fuse
    fuse = new Fuse(fuseData, {
      keys: ["title", "description"],
      threshold: 0.2,
      distance: 100,
      ignoreLocation: true,
    });

    console.log(`✅ Fuse cache loaded (${fuseData.length} reels)`);
  }

  // 🔍 Search
  const result = fuse.search(keyword);
  return result.map(({ item }) => item);
};