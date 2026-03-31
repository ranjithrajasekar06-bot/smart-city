import express from "express";
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssueStatus,
  deleteIssue,
  voteIssue,
  getAnalytics,
} from "../controllers/issueController";
import { protect, admin } from "../middleware/auth";
import { upload } from "../config/cloudinary";

const router = express.Router();

router.get("/", getIssues);
router.get("/analytics", protect, admin, getAnalytics);
router.get("/:id", getIssueById);
router.post("/", protect, upload.single("image"), createIssue);
router.put("/:id/status", protect, admin, updateIssueStatus);
router.delete("/:id", protect, admin, deleteIssue);
router.post("/:id/vote", protect, voteIssue);

export default router;
