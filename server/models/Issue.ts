import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    category: {
      type: String,
      required: [true, "Please select a category"],
    },
    image_url: {
      type: String,
      required: [true, "Please upload an image"],
    },
    latitude: {
      type: Number,
      required: [true, "Please select a location on the map"],
    },
    longitude: {
      type: Number,
      required: [true, "Please select a location on the map"],
    },
    user_address: {
      type: String,
      required: [true, "Please add your address"],
    },
    issue_location: {
      type: String,
      required: [true, "Please add the issue location"],
    },
    pin_code: {
      type: String,
      required: [true, "Please add a pin code"],
    },
    status: {
      type: String,
      enum: ["pending", "submitted", "under-review", "under review", "field-inspection", "repair-scheduled", "in-progress", "in progress", "resolved", "rejected", "emergency"],
      default: "submitted",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    district: {
      type: String,
      default: "",
    },
    taluk: {
      type: String,
      default: "",
    },
    assignedDistrict: {
      type: String,
      default: "",
    },
    assignedTaluk: {
      type: String,
      default: "",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    rating_comment: {
      type: String,
      default: "",
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },
    escalatedAt: {
      type: Date,
    },
    escalationReason: {
      type: String,
      default: "",
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flaggedReason: {
      type: String,
      default: "",
    },
    keywords: {
      type: [String],
      default: [],
    },
    internal_notes: {
      type: [String],
      default: [],
    },
    votes: {
      type: Number,
      default: 0,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Issue", issueSchema);
