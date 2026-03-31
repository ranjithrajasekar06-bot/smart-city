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
      enum: ["pothole", "garbage", "streetlight", "water", "other"],
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
    status: {
      type: String,
      enum: ["pending", "in-progress", "resolved"],
      default: "pending",
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
