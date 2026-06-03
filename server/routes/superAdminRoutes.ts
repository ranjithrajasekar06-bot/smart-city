import express from "express";
import {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getDashboardAnalytics,
  getAuditLogs,
} from "../controllers/superAdminController";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

// All routes here require being authenticated and having "super_admin" role
router.use(protect);
router.use(authorize("super_admin"));

router.get("/admins", getAdmins);
router.post("/admins", createAdmin);
router.put("/admins/:id", updateAdmin);
router.delete("/admins/:id", deleteAdmin);
router.get("/analytics", getDashboardAnalytics);
router.get("/audit-logs", getAuditLogs);

export default router;
