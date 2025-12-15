import mongoose from "mongoose";

const familyGroupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    description: { type: String, trim: true, maxlength: 500, default: "" ,required:true},
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    timeZone: {
      type: String,
      default: "UTC"

    },
    isPublic: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

familyGroupSchema.index({ groupName: 1 }, { unique: true });


export const FamilyGroup = mongoose.model("FamilyGroup", familyGroupSchema);
