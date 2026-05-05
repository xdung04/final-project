import cron from "node-cron";
import db from "../models/index.js";
import { Op } from "sequelize";

// --- BƯỚC 1: ĐỊNH NGHĨA CÁI "RUỘT" (LOGIC) ---
// Tách ra hàm riêng và export để tí nữa gọi ở đâu cũng được
export const checkAndAutoConfirmSalaries = async () => {
  console.log("=== [CRON LOGIC] ĐANG QUÉT CÁC PHIẾU LƯƠNG QUÁ HẠN... ===");
  const now = new Date();

  try {
    const [updatedCount] = await db.Salary.update(
      { 
        status: "AutoConfirmed"
        // Đã bỏ phần adjustmentNote ở đây
      },
      {
        where: {
          status: "Pending",
          deadlineAt: { [Op.lte]: now }
        }
      }
    );

    return updatedCount;
  } catch (error) {
    console.error(">>> [CRON LOGIC LỖI]:", error);
    throw error;
  }
};
// --- BƯỚC 2: CÁI "VỎ" (HẸN GIỜ) ---
export default function startSalaryCron() {
  // Cứ đúng giờ là gọi cái "Ruột" ở trên
  cron.schedule("0 * * * *", async () => {
    console.log("--- Đến giờ rồi, hệ thống tự đi quét lương đây... ---");
    const count = await checkAndAutoConfirmSalaries();
    console.log(`>>> Kết quả: Đã tự động chốt ${count} phiếu.`);
  });
}