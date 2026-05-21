import cron from "node-cron";
import db from "../models/index.js";
import { Op } from "sequelize";

/**
 * Logic cập nhật voucher hết hạn
 * Tìm tất cả CustomerVoucher có status = 'AVAILABLE' và expires_at <= hiện tại
 * Chuyển status thành 'EXPIRED'
 * @returns {Promise<number>} Số lượng voucher được cập nhật
 */
export const expireVouchers = async () => {
  console.log("=== [CRON LOGIC] ĐANG QUÉT VOUCHER HẾT HẠN... ===");
  const now = new Date();

  try {
    const [updatedCount] = await db.CustomerVoucher.update(
      { status: "EXPIRED" },
      {
        where: {
          status: "AVAILABLE",
          expires_at: { [Op.lte]: now },
        },
      }
    );

    console.log(`>>> [CRON LOGIC] Đã cập nhật ${updatedCount} voucher thành EXPIRED.`);
    return updatedCount;
  } catch (error) {
    console.error(">>> [CRON LOGIC LỖI]:", error);
    throw error;
  }
};

/**
 * Khởi động cron job chạy mỗi ngày lúc 00:00 (theo giờ Việt Nam)
 */
export default function startExpireVouchersCron() {
  cron.schedule(
    "0 0 * * *", // 00:00 mỗi ngày
    async () => {
      console.log("--- [Hệ thống GMT+7] Bắt đầu quét voucher hết hạn... ---");
      const count = await expireVouchers();
      console.log(`>>> Kết quả: Đã cập nhật ${count} voucher.`);
    },
    {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh", // ép cron chạy theo giờ Việt Nam
    }
  );
  console.log("⏰ Cron job tự động cập nhật voucher hết hạn đã được khởi động (00:00 hàng ngày).");
}