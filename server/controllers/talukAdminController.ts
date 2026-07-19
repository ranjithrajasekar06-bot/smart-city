import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { logAudit } from "../utils/auditLogger";

// @desc    Create a Taluk Admin (Super Admin only)
// @route   POST /api/taluk-admin/create
// @access  Private/SuperAdmin
export const createTalukAdmin = async (req: any, res: Response) => {
  try {
    const { name, email, password, district, taluk } = req.body;

    if (!name || !email || !password || !district || !taluk) {
      return res.status(400).json({ message: "Please provide name, email, password, district, and taluk" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const talukAdmin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "taluk_admin",
      district,
      taluk,
      isActive: true,
    });

    await logAudit(
      req.user?._id?.toString() || "system",
      req.user?.name || "Super Admin",
      "super_admin",
      `Created Taluk Admin: ${name} for ${district} - ${taluk}`
    );

    res.status(201).json({
      _id: talukAdmin._id,
      name: talukAdmin.name,
      email: talukAdmin.email,
      role: talukAdmin.role,
      district: talukAdmin.district,
      taluk: talukAdmin.taluk,
      isActive: talukAdmin.isActive,
      createdAt: talukAdmin.createdAt,
    });
  } catch (error: any) {
    console.error("Create Taluk Admin Error:", error);
    res.status(500).json({ message: "Server error creating Taluk Admin" });
  }
};

// @desc    Get all Taluk Admins (Super Admin only)
// @route   GET /api/taluk-admin/list
// @access  Private/SuperAdmin
export const getTalukAdmins = async (req: Request, res: Response) => {
  try {
    const list = await User.find({ role: "taluk_admin" }).select("-password");
    res.json(list);
  } catch (error: any) {
    console.error("List Taluk Admins Error:", error);
    res.status(500).json({ message: "Server error listing Taluk Admins" });
  }
};

// @desc    Update a Taluk Admin (Super Admin only)
// @route   PUT /api/taluk-admin/update/:id
// @access  Private/SuperAdmin
export const updateTalukAdmin = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, district, taluk, isActive } = req.body;

    const talukAdmin = await User.findById(id);
    if (!talukAdmin) {
      return res.status(404).json({ message: "Taluk Admin not found" });
    }

    if (name) talukAdmin.name = name;
    if (email) talukAdmin.email = email;
    if (district) talukAdmin.district = district;
    if (taluk) talukAdmin.taluk = taluk;
    if (typeof isActive !== "undefined") talukAdmin.isActive = isActive;

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      talukAdmin.password = await bcrypt.hash(password, salt);
    }

    await talukAdmin.save();

    await logAudit(
      req.user?._id?.toString() || "system",
      req.user?.name || "Super Admin",
      "super_admin",
      `Updated Taluk Admin: ${talukAdmin.name}`
    );

    res.json({
      _id: talukAdmin._id,
      name: talukAdmin.name,
      email: talukAdmin.email,
      role: talukAdmin.role,
      district: talukAdmin.district,
      taluk: talukAdmin.taluk,
      isActive: talukAdmin.isActive,
      updatedAt: talukAdmin.updatedAt,
    });
  } catch (error: any) {
    console.error("Update Taluk Admin Error:", error);
    res.status(500).json({ message: "Server error updating Taluk Admin" });
  }
};

// @desc    Delete a Taluk Admin (Super Admin only)
// @route   DELETE /api/taluk-admin/delete/:id
// @access  Private/SuperAdmin
export const deleteTalukAdmin = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const talukAdmin = await User.findById(id);
    if (!talukAdmin) {
      return res.status(404).json({ message: "Taluk Admin not found" });
    }

    await User.findByIdAndDelete(id);

    await logAudit(
      req.user?._id?.toString() || "system",
      req.user?.name || "Super Admin",
      "super_admin",
      `Deleted Taluk Admin: ${talukAdmin.name}`
    );

    res.json({ message: "Taluk Admin successfully deleted" });
  } catch (error: any) {
    console.error("Delete Taluk Admin Error:", error);
    res.status(500).json({ message: "Server error deleting Taluk Admin" });
  }
};
