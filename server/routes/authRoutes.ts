import express from "express";
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateLocation,
  forgotPassword,
  resetPassword
} from "../controllers/authController";
import { protect } from "../middleware/auth";
import { loginRateLimiter } from "../middleware/rateLimiter";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginRateLimiter(5, 5 * 60 * 1000), loginUser); // limit logins to 5 per 5 mins per IP
router.get("/profile", protect, getUserProfile);
router.put("/location", protect, updateLocation);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
