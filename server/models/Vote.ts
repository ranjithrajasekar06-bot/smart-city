import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    issue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
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

// Prevent user from voting multiple times on the same issue
voteSchema.index({ issue_id: 1, user_id: 1 }, { unique: true });

export default mongoose.model("Vote", voteSchema);
