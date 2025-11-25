import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyGroup",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["admin", "careGiver", "familyMember", "readonly", "careRecipient"],
      default: "readonly",
    },
    status: {
      type: String,
      enum: ["active", "pending", "removed"],
      default: "pending",
    },
    permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
    joinedAt: { type: Date, default: Date.now },
    onboardingStatus: {
      type: String,
      enum: ["not_required", "required", "completed"],
      default: "not_required",
    }
  },
  { timestamps: true, versionKey: false }
);

membershipSchema.index({ groupId: 1, userId: 1 }, { unique: true });

export const Membership = mongoose.model("Membership", membershipSchema);
