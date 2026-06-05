import express from "express";
import { getUsers, updateUserStatus, deleteUser, getGeneralAnalytics } from "../controllers/userController";
import { protect, admin } from "../middleware/auth";

const router = express.Router();

router.use(protect);
router.use(admin);

// User retrieval, state, and pruning
router.get("/", getUsers);
router.put("/:id/status", updateUserStatus);
router.delete("/:id", deleteUser);

// General comprehensive municipal analytics
router.get("/analytics", getGeneralAnalytics);

export default router;
