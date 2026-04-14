import express from "express";
import { getHashtags, getTopHashtags } from "../controllers/hashtagController.js";

const router = express.Router();

router.get("/", getHashtags);
router.get("/top", getTopHashtags);

export default router;
