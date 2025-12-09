import mongoose from "mongoose";

const vitalSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["bp", "heart_rate", "weight", "glucose", "temperature"],
      index: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyGroup",
      required: true,
      index: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  { timestamps: true }
);

vitalSchema.index({ userId: 1, type: 1, recordedAt: 1 });

export const Vital = mongoose.model("Vital", vitalSchema);
