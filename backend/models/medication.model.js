import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    dosage: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "as_needed"],
      required: true,
      default: "daily",
      index: true,
    },
    timesPerDay: {
      type: Number,
      min: 0,
      max: 24,
      default: null,
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    refillDate: {
      type: Date,
      default: null,
    },
    supplyCount: {
      type: Number,
      min: 0,
      default: null,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyGroup",
      required: true,
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
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

medicationSchema.index({ groupId: 1, recipientId: 1, active: 1 });

export const Medication = mongoose.model("Medication", medicationSchema);