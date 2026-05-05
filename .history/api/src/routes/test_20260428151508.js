import  checkAndAutoConfirmSalaries  from "..salaryCron.js";

// Route này chỉ dùng để Dev test, không cho Barber biết
router.get("/debug/force-cron-salary", async (req, res) => {
    // Gọi cái "Ruột" chạy ngay lập tức!
    const updatedCount = await checkAndAutoConfirmSalaries();
    
    res.json({
        success: true,
        message: "Hệ thống đã quét xong!",
        updated: updatedCount
    });
});