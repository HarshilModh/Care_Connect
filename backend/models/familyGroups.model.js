import mongoose from "mongoose";

const familyGroupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
      //Group name must be valid like "Family Group 1 only numer are not allowed valid names: John Doe, FamilyGroup123 not valid names: 12345, @Family!"
      match: [/^[a-zA-Z][a-zA-Z0-9\s]{1,99}$/, 'Group name must be valid can contain letters, numbers, and spaces, but not start with a number or special character.'],
    },
    description: { type: String, trim: true, maxlength: 500, default: "" ,required:true,
      //Description can contain letters, numbers, spaces, and basic punctuation. but not special characters like <, >, {, },and also cannot contain only numbers
      match: [/^(?!^\d+$)[a-zA-Z0-9\s.,'"\-!?()]{1,500}$/, 'Description can contain letters, numbers, spaces, and basic punctuation, but not special characters like <, >, {, }, and cannot contain only numbers.'],
    },
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
