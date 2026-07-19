import { Request, Response } from "express";
import District from "../models/District";

// @desc    Get all districts
// @route   GET /api/districts
// @access  Public
export const getDistricts = async (req: Request, res: Response) => {
  try {
    const districts = await District.find({});
    res.json(districts);
  } catch (error: any) {
    console.error("Error fetching districts:", error);
    res.status(500).json({ message: "Error fetching districts" });
  }
};

// @desc    Get taluks for a district
// @route   GET /api/districts/:district/taluks
// @access  Public
export const getTaluksByDistrict = async (req: Request, res: Response) => {
  try {
    const { district } = req.params;
    const doc = await District.findOne({ 
      districtName: { $regex: new RegExp(`^${district}$`, "i") } 
    });
    
    if (!doc) {
      // Direct exact match fallback
      const exactDoc = await District.findOne({ districtName: district });
      if (!exactDoc) {
        return res.status(404).json({ message: "District not found in Tamil Nadu" });
      }
      return res.json(exactDoc.taluks);
    }
    
    res.json(doc.taluks);
  } catch (error: any) {
    console.error(`Error fetching taluks for ${req.params.district}:`, error);
    res.status(500).json({ message: "Error fetching taluks" });
  }
};
