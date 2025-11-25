// models/CareRecipientProfile.js
import mongoose from "mongoose";

const emergencyContactSchema = new mongoose.Schema(
    {
        name: String,
        relation: String,
        phone: String,
    },
    { _id: false }
);

const careRecipientProfileSchema = new mongoose.Schema(
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
        dob: { type: Date, required: false },
        primaryCondition: { type: String, default: "" },
        notes: { type: String, default: "" },
        emergencyContacts: [emergencyContactSchema],
    },
    { timestamps: true, versionKey: false }
);

careRecipientProfileSchema.index({ groupId: 1, userId: 1 }, { unique: true });

export const CareRecipientProfile = mongoose.model(
    "CareRecipientProfile",
    careRecipientProfileSchema
);