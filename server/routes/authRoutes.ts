import express from "express";
import { registerUser, loginUser, getUserProfile, updateLocation } from "../controllers/authController";
import { protect } from "../middleware/auth";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/location", protect, updateLocation);

export default router;
