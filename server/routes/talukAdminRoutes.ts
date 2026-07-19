import express from "express";
import {
  createTalukAdmin,
  getTalukAdmins,
  updateTalukAdmin,
  deleteTalukAdmin,
} from "../controllers/talukAdminController";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

// All taluk admin manager actions are protected and limited to super_admin
router.use(protect);
router.use(authorize("super_admin"));

router.post("/create", createTalukAdmin);
router.get("/list", getTalukAdmins);
router.put("/update/:id", updateTalukAdmin);
router.delete("/delete/:id", deleteTalukAdmin);

export default router;
