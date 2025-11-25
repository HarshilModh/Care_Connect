// models/CaregiverProfile.js
import mongoose from "mongoose";

const caregiverProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // only one caregiver profile per user
            index: true,
        },
        bio: { type: String, default: "" },
        experienceYears: { type: Number, default: 0 },
        skills: [{ type: String }],          // ["dementia care", "medication management"]
        certifications: [{ type: String }],  // ["RN", "CPR"]
        availability: { type: String, default: "" }, // or more structured if you want
        rate: { type: Number, default: 0 },  // hourly rate etc.
    },
    { timestamps: true, versionKey: false }
);

export const CaregiverProfile = mongoose.model(
    "CaregiverProfile",
    caregiverProfileSchema
);