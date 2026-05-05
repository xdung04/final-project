import cron from "node-cron";
import db from "../models/index.js";
import { Op } from "sequelize";

const Salary = db.Salary;

export default function startSalaryCron() {
  cron.schedule("0 * * * *", async () => {
    console.log("=== [CRON] BẮT ĐẦU KIỂM TRA HẠN XÁC NHẬN LƯƠNG ===");
    
    const now = new Date();

    try {
      // Tìm các phiếu lương:
      // 1. Trạng thái đang là 'Pending' (Chờ thợ xác nhận)
      // 2. deadlineAt đã nhỏ hơn hoặc bằng thời điểm hiện tại
      const [updatedCount] = await db.Salary.update(
        { 
          status: "AutoConfirmed",
          adjustmentNote: db.sequelize.literal(
            "CONCAT(COALESCE(adjustmentNote, ''), ' [Hệ thống]: Tự động xác nhận do quá 48h không phản hồi.')"
          )
        },
        {
          where: {
            status: "Pending",
            deadlineAt: {
              [Op.lte]: now
            }
          }
        }
      );

      if (updatedCount > 0) {
        console.log(`>>> [CRON] Thành công: Đã tự động xác nhận ${updatedCount} phiếu lương.`);
      } else {
        console.log(">>> [CRON] Thông báo: Không có phiếu lương nào cần xử lý.");
      }

    } catch (error) {
      console.error(">>> [CRON LỖI]: Quá trình tự động xác nhận thất bại!", error);
    }
    
    console.log("=== [CRON] KẾT THÚC TIẾN TRÌNH ===");
  });
};