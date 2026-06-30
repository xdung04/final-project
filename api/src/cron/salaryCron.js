import cron from "node-cron";
import db from "../models/index.js";
import { Op } from "sequelize";

// ─────────────────────────────────────────────────────────────
// LOGIC: Tự động xác nhận phiếu lương quá 48h
// ─────────────────────────────────────────────────────────────
export const checkAndAutoConfirmSalaries = async () => {
  console.log("=== [CRON] Quét phiếu lương quá hạn 48h... ===");

  try {
    const [updatedCount] = await db.Salary.update(
      { status: "AutoConfirmed" },
      {
        where: {
          status:     "Pending",
          deadlineAt: { [Op.lte]: new Date() },
        },
      }
    );

    console.log(`>>> Đã tự động xác nhận ${updatedCount} phiếu.`);
    return updatedCount;
  } catch (err) {
    console.error("❌ [CRON] Lỗi auto-confirm lương:", err.message);
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────
// SCHEDULER
// ─────────────────────────────────────────────────────────────
export default function startSalaryCron() {
  // Chạy mỗi giờ — đủ chính xác cho window 48h
  cron.schedule("0 * * * *", async () => {
    console.log("--- [Cron GMT+7] Chạy job tự động xác nhận lương ---");
    try {
      const count = await checkAndAutoConfirmSalaries();
      console.log(`>>> Kết quả: ${count} phiếu được chốt.`);
    } catch (err) {
      console.error("❌ [Cron] Job thất bại:", err.message);
      // Không throw — tránh crash toàn bộ cron process
    }
  }, {
    scheduled: true,
    timezone:  "Asia/Ho_Chi_Minh",
  });

  console.log("✅ [Cron] startSalaryCron đã khởi động.");
}