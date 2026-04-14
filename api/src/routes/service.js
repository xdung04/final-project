import express from "express";
import {
  getHot, 
  getById,
  assignServiceToBranch,   
  createService,
  updateService,
  deleteService,
  getAllServices,
  unassignServiceFromBranch,
  uploadServiceImage ,
checkAndHideController  } from "../controllers/serviceController.js";

const router = express.Router();

router.get("/hot", getHot);
router.get("/:id", getById);
router.post("/assign-branch", assignServiceToBranch);
router.delete("/unassign-branch", unassignServiceFromBranch);
router.post(
  "/",
  uploadServiceImage.single("image"), // 👈 xử lý upload field "image"
  createService
);

router.put(
  "/:id",
  uploadServiceImage.single("image"), // 👈 thêm dòng này
  updateService
);
router.delete("/:id", deleteService);
router.get("/", getAllServices);
router.post("/:id/check-hide", checkAndHideController );
export default router;
