import express from "express";
import { findCustomerByPhone, createBookingDirect } from "../controllers/bookingDirectController.js";

const router = express.Router();

router.get("/find", findCustomerByPhone);
router.post("/create", createBookingDirect);

export default router;
