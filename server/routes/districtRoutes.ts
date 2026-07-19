import express from "express";
import { getDistricts, getTaluksByDistrict } from "../controllers/districtController";

const router = express.Router();

router.get("/", getDistricts);
router.get("/:district/taluks", getTaluksByDistrict);

export default router;
