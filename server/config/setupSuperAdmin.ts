import bcrypt from "bcryptjs";
import User from "../models/User";
import District from "../models/District";
import { logAudit } from "../utils/auditLogger";

const setupSuperAdmin = async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL || "superadmin@tnsmartcity.gov";
    const password = process.env.SUPER_ADMIN_PASSWORD || "StrongPassword123!";

    // Check if any Super Admin exists
    const superAdminExists = await User.findOne({ role: "super_admin" });

    if (!superAdminExists) {
      console.log("No Super Admin found. Creating initial TN Super Admin...");

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newSuperAdmin = await User.create({
        name: "Super Admin",
        email: email,
        password: hashedPassword,
        role: "super_admin",
        isActive: true,
      });

      console.log(`Super Admin successfully created with email: ${email}`);
      await logAudit(
        newSuperAdmin._id.toString(),
        "Super Admin",
        "super_admin",
        "Initial Tamil Nadu Super Admin account automatically created"
      );
    } else {
      console.log(`Super Admin already exists: ${superAdminExists.email}`);
    }

    // Seed Tamil Nadu Districts & Taluks
    const initialDistricts = [
      {
        districtName: "Chennai",
        taluks: ["Madhavaram", "Ambattur", "Alandur", "Egmore", "Perambur"]
      },
      {
        districtName: "Coimbatore",
        taluks: ["Coimbatore North", "Coimbatore South", "Mettupalayam"]
      },
      {
        districtName: "Madurai",
        taluks: ["Madurai East", "Madurai West", "Melur"]
      }
    ];

    for (const d of initialDistricts) {
      const exists = await District.findOne({ districtName: d.districtName });
      if (!exists) {
        await District.create(d);
        console.log(`Seeded Tamil Nadu District: ${d.districtName}`);
      }
    }
  } catch (error) {
    console.error("Error setting up Super Admin & Districts:", error);
  }
};

export default setupSuperAdmin;
