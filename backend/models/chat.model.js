import mongoose from "mongoose";

const { Schema } = mongoose;

const ChatSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "FamilyGroup",
      required: true,
      index: true
    },

    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000
    },

    // Optional attachments (images/docs). Store Cloudinary/S3 URLs + basic info
    attachments: [
      {
        url: { type: String, trim: true },
        type: { type: String, enum: ["image", "file", "audio", "video"] },
        name: { type: String },
        size: { type: Number } // bytes
      }
    ],

    // Soft delete flag (useful for preserving threads)
    deleted: {
      type: Boolean,
      default: false,
      index: true
    },

    // Per-user read receipts (avoid global status overriding)
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        at: { type: Date, default: Date.now }
      }
    ],

    // Delivery receipts (optional)
    deliveredTo: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        at: { type: Date, default: Date.now }
      }
    ],

    // Typing/extra metadata remains flexible
    meta: {
      type: Schema.Types.Mixed
    },

    // Keep a coarse status for sender device UX (optional)
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
      index: true
    }
  },
  { timestamps: true }
);

// Indexes for performance
ChatSchema.index({ groupId: 1, createdAt: -1 });     // pagination
ChatSchema.index({ groupId: 1, deleted: 1 });        // exclude deleted efficiently
ChatSchema.index({ message: "text" });               // text search over message
ChatSchema.index({ senderId: 1, createdAt: -1 });    // user history queries

export const Chat = mongoose.model("Chat", ChatSchema);