import cron from "node-cron";
import db from "../models/index.js";
import { Op } from "sequelize";

const Branch = db.Branch;

export default function startBranchStatusCron() {
  cron.schedule(
     "0 0 * * *",
    async () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      console.log("Cron chạy lúc:", now.toLocaleString("vi-VN"), "| today =", today);

      try {
        
        // BƯỚC 1: Activate — resumeDate <= hôm nay, clear suspendDate luôn
        const [activatedRows] = await Branch.update(
          { status: "Active", suspendDate: null, resumeDate: null },
          {
            where: {
              status: "Inactive",
              resumeDate: { [Op.lte]: today },
            },
          }
        );
        console.log("Activated xong:", activatedRows);

        // BƯỚC 2: Suspend — suspendDate <= hôm nay
        // Row vừa activate đã bị clear suspendDate nên sẽ không bị match ở đây
        const [suspendedRows] = await Branch.update(
          { status: "Inactive" },
          {
            where: {
              status: "Active",
              suspendDate: { [Op.lte]: today },
              [Op.or]: [
                { resumeDate: null },
                { resumeDate: { [Op.gt]: today } },
              ],
            },
          }
        );
        console.log("Suspended xong:", suspendedRows);

        console.log(`✅ Cron update: activated ${activatedRows}, suspended ${suspendedRows}`);
      } catch (err) {
        console.error("❌ Lỗi cron:", err);
      }
    },
    { timezone: "Asia/Ho_Chi_Minh" }
  );
}