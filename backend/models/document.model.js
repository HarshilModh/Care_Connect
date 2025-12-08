import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyGroup",
      required: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    key: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    url: {
      type: String,
      required: false,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

export const Document = mongoose.model("Document", documentSchema);
