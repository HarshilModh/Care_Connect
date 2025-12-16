import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
        match: [
    /^(?=.*[a-zA-Z])[a-zA-Z0-9\s.,()\-]+$/,
    "Medication name must contain letters and may include numbers, spaces, hyphens, and parentheses.",
  ],},
   dosage: {
  type: String,
  trim: true,
  maxlength: 100,
  default: "",
 match: [
  /^$|^\s*\d+(\.\d+)?(\s*[-–]\s*\d+(\.\d+)?)?\s*(mg|g|ml|mcg|milligrams?|grams?|milliliters?|units?|tablets?|capsules?)\s*$/i,
  "Dosage must include a number and unit (e.g., 400 mg, 1–2 tablets).",
],
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