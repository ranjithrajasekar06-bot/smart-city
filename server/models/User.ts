import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password?: string;
  role: "citizen" | "taluk_admin" | "super_admin" | "admin";
  phone?: string;
  district?: string;
  taluk?: string;
  address?: string;
  department?: "Road Maintenance" | "Water Supply" | "Electricity" | "Waste Management" | "Emergency Services" | null;
  isActive: boolean;
  failedLoginAttempts: number;
  lockUntil?: Date | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["citizen", "taluk_admin", "super_admin", "admin"],
      default: "citizen",
    },
    phone: {
      type: String,
      default: "",
    },
    district: {
      type: String,
      default: "",
    },
    taluk: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    department: {
      type: String,
      enum: ["Road Maintenance", "Water Supply", "Electricity", "Waste Management", "Emergency Services", null],
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>("User", userSchema);
