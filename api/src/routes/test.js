import { checkAndAutoConfirmSalaries } from "../cron/salaryCron.js"; // THÊM { } VÀO ĐÂY
import express from "express";

const router = express.Router();

// Route này chỉ dùng để Dev test
router.get("/force-cron-salary", async (req, res) => {
    try {
        // Gọi cái "Ruột" chạy ngay lập tức!
        const updatedCount = await checkAndAutoConfirmSalaries();
        
        res.json({
            success: true,
            message: "Hệ thống đã quét xong!",
            updatedCount: updatedCount
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router; // Đừng quên dòng này để dùng bên server.js