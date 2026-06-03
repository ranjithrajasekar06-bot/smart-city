import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import User from "../models/User";
import Issue from "../models/Issue";
import AuditLog from "../models/AuditLog";
import { logAudit } from "../utils/auditLogger";

// @desc    Get all admins
// @route   GET /api/superadmin/admins
// @access  Private (Super Admin)
export const getAdmins = async (req: any, res: Response) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password");
    res.json(admins);
  } catch (error: any) {
    console.error("Get Admins Error:", error);
    res.status(500).json({ message: "Server error fetching admins" });
  }
};

// @desc    Create a new admin
// @route   POST /api/superadmin/admins
// @access  Private (Super Admin)
export const createAdmin = async (req: any, res: Response) => {
  try {
    const { name, email, department, password } = req.body;

    if (!name || !email || !department || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    const adminExists = await User.findOne({ email });

    if (adminExists) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      department,
      isActive: true,
    });

    if (admin) {
      await logAudit(
        req.user._id.toString(),
        req.user.name,
        req.user.role,
        `Admin account created: ${admin.name} (${admin.email}) for department ${department}`
      );

      res.status(201).json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        department: admin.department,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
      });
    } else {
      res.status(400).json({ message: "Invalid admin data" });
    }
  } catch (error: any) {
    console.error("Create Admin Error:", error);
    res.status(500).json({ message: "Server error creating admin" });
  }
};

// @desc    Update an admin
// @route   PUT /api/superadmin/admins/:id
// @access  Private (Super Admin)
export const updateAdmin = async (req: any, res: Response) => {
  try {
    const { name, email, department, isActive, password } = req.body;
    const admin = await User.findById(req.params.id);

    if (!admin || admin.role !== "admin") {
      return res.status(404).json({ message: "Admin not found" });
    }

    admin.name = name || admin.name;
    admin.email = email || admin.email;
    admin.department = department !== undefined ? department : admin.department;
    admin.isActive = isActive !== undefined ? isActive : admin.isActive;

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
    }

    await admin.save();

    await logAudit(
      req.user._id.toString(),
      req.user.name,
      req.user.role,
      `Admin account updated: ${admin.name} (${admin.email}). Active: ${admin.isActive}`
    );

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      department: admin.department,
      isActive: admin.isActive,
      updatedAt: admin.updatedAt,
    });
  } catch (error: any) {
    console.error("Update Admin Error:", error);
    res.status(500).json({ message: "Server error updating admin" });
  }
};

// @desc    Delete an admin
// @route   DELETE /api/superadmin/admins/:id
// @access  Private (Super Admin)
export const deleteAdmin = async (req: any, res: Response) => {
  try {
    const admin = await User.findById(req.params.id);

    if (!admin || admin.role !== "admin") {
      return res.status(404).json({ message: "Admin not found" });
    }

    const adminName = admin.name;
    const adminEmail = admin.email;

    await User.findByIdAndDelete(req.params.id);

    await logAudit(
      req.user._id.toString(),
      req.user.name,
      req.user.role,
      `Admin account deleted: ${adminName} (${adminEmail})`
    );

    res.json({ message: "Admin account successfully deleted" });
  } catch (error: any) {
    console.error("Delete Admin Error:", error);
    res.status(500).json({ message: "Server error deleting admin" });
  }
};

// @desc    Get dashboard analytics
// @route   GET /api/superadmin/analytics
// @access  Private (Super Admin)
export const getDashboardAnalytics = async (req: any, res: Response) => {
  try {
    const totalCitizens = await User.countDocuments({ role: "citizen" });
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalIssues = await Issue.countDocuments();
    
    // Critical urgency or "is_emergency" in descriptions or severity checks
    const emergencyIssues = await Issue.countDocuments({
      $or: [
        { urgency: "critical" },
        { keywords: "emergency" }
      ]
    });

    // Department Statistics - group issues by category
    const categoryStats = await Issue.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        }
      }
    ]);

    const formattedCategoryStats: { [key: string]: number } = {
      "Road Maintenance": 0,
      "Water Supply": 0,
      "Electricity": 0,
      "Waste Management": 0,
      "Emergency Services": 0,
    };

    categoryStats.forEach(stat => {
      if (stat._id) {
        formattedCategoryStats[stat._id] = stat.count;
      }
    });

    // Also fetch status breakdown
    const statusStats = await Issue.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Past 30 days of admin activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const adminActivities = await AuditLog.aggregate([
      {
        $match: {
          role: "admin",
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const activityMap = new Map();
    adminActivities.forEach((act) => {
      activityMap.set(act._id, act.count);
    });

    const activityTimeline: Array<{ date: string; fullDate: string; actions: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const formattedDate = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      
      activityTimeline.push({
        date: formattedDate,
        fullDate: dateStr,
        actions: activityMap.get(dateStr) || 0
      });
    }

    res.json({
      totalCitizens,
      totalAdmins,
      totalIssues,
      emergencyIssues,
      departmentStats: formattedCategoryStats,
      statusStats: statusStats.reduce((acc: any, curr: any) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      activityTimeline
    });
  } catch (error: any) {
    console.error("Get Analytics Error:", error);
    res.status(500).json({ message: "Server error retrieving dashboard analytics" });
  }
};

// @desc    Get system audit logs
// @route   GET /api/superadmin/audit-logs
// @access  Private (Super Admin)
export const getAuditLogs = async (req: any, res: Response) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error: any) {
    console.error("Get Audit Logs Error:", error);
    res.status(500).json({ message: "Server error fetching audit logs" });
  }
};
