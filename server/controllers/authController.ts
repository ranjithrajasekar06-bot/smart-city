import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response } from "express";
import User, { IUser } from "../models/User";
import { logAudit } from "../utils/auditLogger";

const generateToken = (id: string, email: string, role: string) => {
  return jwt.sign(
    { userId: id, email, role },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "30h" }
  );
};

// @desc    Register a new user (Citizens only)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, district, taluk, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // CITIZENS MUST ALWAYS BE REGISTERED AS "citizen"
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "citizen",
      phone: phone || "",
      district: district || "",
      taluk: taluk || "",
      address: address || "",
      isActive: true,
    });

    if (user) {
      await logAudit(user._id.toString(), user.name, "citizen", "Citizen registered account");

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        district: user.district,
        taluk: user.taluk,
        address: user.address,
        isActive: user.isActive,
        latitude: user.latitude,
        longitude: user.longitude,
        createdAt: user.createdAt,
        token: generateToken(user._id.toString(), user.email, user.role),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error: any) {
    console.error("Register Error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Server error during registration" });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please enter email and password" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check account status
    if (user.isActive === false) {
      return res.status(403).json({ message: "This account has been deactivated. Please contact support." });
    }

    // Check lock
    const now = new Date();
    if (user.lockUntil && user.lockUntil > now) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - now.getTime()) / (60 * 1000));
      return res.status(403).json({
        message: `Account locked due to 5 failed attempts. Try again in ${remainingMinutes} minutes.`,
      });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password || "");

    if (isMatch) {
      // Success: Reset failed logins
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();

      await logAudit(user._id.toString(), user.name, user.role, `User logged in successfully`);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        district: user.district,
        taluk: user.taluk,
        address: user.address,
        isActive: user.isActive,
        latitude: user.latitude,
        longitude: user.longitude,
        createdAt: user.createdAt,
        token: generateToken(user._id.toString(), user.email, user.role),
      });
    } else {
      // Incorrect password: increment failed login count
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      
      let message = "Invalid email or password";
      const remainingAttempts = 5 - user.failedLoginAttempts;

      if (user.failedLoginAttempts >= 5) {
        // Lock for 15 minutes
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.failedLoginAttempts = 0; // reset attempts for next session
        await user.save();
        await logAudit(user._id.toString(), user.name, user.role, "Account temporarily locked due to excessive failed logins");
        message = "Account locked for 15 minutes due to 5 failed login attempts.";
      } else {
        await user.save();
        if (remainingAttempts > 0) {
          message = `Invalid email or password. You have ${remainingAttempts} attempts remaining before account lock.`;
        }
      }

      res.status(401).json({ message });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is active but flagged as deactivated" });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        district: user.district,
        taluk: user.taluk,
        address: user.address,
        isActive: user.isActive,
        latitude: user.latitude,
        longitude: user.longitude,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};

// @desc    Update user location
// @route   PUT /api/auth/location
// @access  Private
export const updateLocation = async (req: any, res: Response) => {
  try {
    const { latitude, longitude } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
      user.latitude = Number(latitude);
      user.longitude = Number(longitude);
      await user.save();
      res.json({ message: "Location updated" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Update Location Error:", error);
    res.status(500).json({ message: "Server error updating location" });
  }
};

// @desc    Forgot Password Initial Flow (Generates a secure token)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Please enter your email" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal if user does not exist, just say token sent
      return res.json({ 
        message: "If that email exists, we've sent a recovery token to it.",
        mockToken: null
      });
    }

    // Generate 6 digit pin or hex token
    const rawToken = crypto.randomBytes(20).toString("hex");
    
    user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiration
    await user.save();

    await logAudit(user._id.toString(), user.name, user.role, "Forgot password token generated");

    // We return it in the API for simulated preview UI purposes so the user can actually use it!
    res.json({
      message: "Security reset token generated successfully.",
      mockToken: rawToken, // Returned so the preview user can write it directly in the form!
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error during forgot password processing" });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Please provide both reset token and new password" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.failedLoginAttempts = 0; // clear any locks
    user.lockUntil = null;
    await user.save();

    await logAudit(user._id.toString(), user.name, user.role, "Password successfully reset");

    res.json({ message: "Password updated successfully. You can now login." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};
