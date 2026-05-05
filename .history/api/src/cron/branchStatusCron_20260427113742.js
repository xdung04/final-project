import cron from "node-cron";
import db from "../models/index.js";
import { Op } from "sequelize";

const Branch = db.Branch;

export default function startBranchStatusCron() {
  cron.schedule(
    "0 0 0 * * *", // 00:00:00 mỗi ngày
    async () => {
      console.log("Cron chạy lúc:", new Date().toLocaleString("vi-VN"));

      const today = new Date().toISOString().split("T")[0];

      try {
        // 1) Kích hoạt chi nhánh khi đến resumeDate
        const [activatedRows] = await Branch.update(
          {
            status: "Active",
          },
          {
            where: {
              status: "Inactive",
              resumeDate: { [Op.lte]: today },
            },
          }
        );

        // 2) Ngừng hoạt động khi đến suspendDate 
        // ❗ chỉ ngưng nếu hôm nay < resumeDate (chưa đến ngày mở lại)
        const [suspendedRows] = await Branch.update(
          { status: "Inactive" },
          {
            where: {
              status: "Active",
              suspendDate: { [Op.lte]: today },

              // ❗ Nếu có resumeDate thì phải đảm bảo chưa đến resumeDate
              [Op.or]: [
                { resumeDate: null },
                { resumeDate: { [Op.gt]: today } },
              ],
            },
          }
        );

        console.log(
          `Cron update: activated ${activatedRows}, suspended ${suspendedRows}`
        );

      } catch (err) {
        console.error("Lỗi cron:", err);
      }
    },
    {
      timezone: "Asia/Ho_Chi_Minh",
    }
  );
}
