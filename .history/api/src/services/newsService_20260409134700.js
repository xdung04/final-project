// services/bannerService.js
import db from "../models/index.js";
import { Op } from "sequelize";

const { Banner } = db;

/**
 * Lấy banner active cho Home (public)
 */
export const getActiveBanners = async () => {
  const now = new Date();
  return await Banner.findAll({
    where: {
      isActive: true,
      [Op.or]: [
        { startAt: null },
        { startAt: { [Op.lte]: now } }
      ],
      [Op.or]: [
        { endAt: null },
        { endAt: { [Op.gte]: now } }
      ]
    },
    order: [["createdAt", "DESC"]],
    attributes: ["imageUrl"] // Chỉ trả về URL ảnh cho frontend Home
  });
};

/**
 * Admin tạo banner mới
 */
export const createBanner = async (data) => {
  return await Banner.create({
    title: data.title || null,
    imageUrl: data.imageUrl,
    linkUrl: data.linkUrl || null,
    startAt: data.startAt || null,
    endAt: data.endAt || null,
    isActive: true,
  });
};