import cron from "node-cron";
import db from "../models/index.js";
import { Op } from "sequelize";

/**
 * Khóa barber khi tới lockDate
 */
export const checkAndLockBarbers = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Tìm các barber cần khóa
  const barbersToLock = await db.Barber.findAll({
    where: {
      isLocked: false,
      lockDate: {
        [Op.lte]: today,
      },
    },
  });

  if (barbersToLock.length === 0) {
    console.log("[BarberLockCron] Không có tài khoản nào cần khóa.");
    return 0;
  }

  // Khóa từng barber
  for (const barber of barbersToLock) {
    barber.isLocked = true;
    barber.lockDate = null;

    await barber.save();

    console.log(`[BarberLockCron] Đã khóa barber ID=${barber.idBarber}`);
  }

  console.log(`[BarberLockCron] Hoàn tất — ${barbersToLock.length} tài khoản bị khóa.`);

  return barbersToLock.length;
};

/**
 * Cron chạy mỗi ngày lúc 00:00:05
 */
export default function startBarberLockCron() {
  cron.schedule(
    "5 0 0 * * *",
    async () => {
      console.log("[BarberLockCron] Kiểm tra lịch khóa thợ...", new Date().toLocaleString("vi-VN"));

      try {
        await checkAndLockBarbers();
      } catch (err) {
        console.error("[BarberLockCron] Lỗi:", err);
      }
    },
    {
      timezone: "Asia/Ho_Chi_Minh",
    },
  );
}
