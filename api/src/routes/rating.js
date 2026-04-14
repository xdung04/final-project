import express from "express";
import ratingController from "../controllers/ratingController.js";

const router = express.Router();

router.get("/barber/:idBarber", ratingController.getRatingSummaryByBarber);
router.post("/barber/:idBarber", ratingController.updateRating);
router.get("/branch/:idBranch", ratingController.getAllRatingsByBranch);

export default router;
