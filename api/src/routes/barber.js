import express from "express";
import barberController from "../controllers/barberController.js";
import { authenticate} from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/", barberController.syncBarbers);
router.get("/", barberController.getAllBarbers);

router.post("/assign-user", barberController.assignUserAsBarber);
router.post("/assign-branch", barberController.assignBarberToBranch);
// router.post("/approve", barberController.approveBarber);
router.post("/lock", barberController.lockBarber);
router.post("/unlock", barberController.unlockBarber);
router.get("/reward/:idBarber", barberController.getBarberReward);

router.post("/create", barberController.createBarberWithUser);
router.put("/update/:idBarber", barberController.updateBarber);
router.post("/unavailability", barberController.addBarberUnavailability);
router.get("/unavailability/:idBarber", barberController.getBarberUnavailabilities);

router.get("/profile/:idBarber", barberController.getBarberProfile);
router.put(
  "/profile/:idBarber",authenticate,
  barberController.uploadAvatar.single("image"),
  barberController.updateBarberProfile
);

router.get("/stats/:idBarber", authenticate, barberController.getDashboardStats);
router.get("/home", barberController.getBarbersForHome);
export default router;
