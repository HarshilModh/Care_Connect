import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "join_request",
        "task_reminder",
        "task_assigned",
        "task_completed",
        "group_update",
        "member_added",
        "member_removed",
        "system",
      ],
      required: true,
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for system notifications
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyGroup",
      default: null,
    },
    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      default: null,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxLength: 1000,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    markedForDeletion: {
      type: Boolean,
      default: false,
      index: true,
    },
    actionStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", null],
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying of user's unread notifications
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

// Index for cleanup of expired notifications
notificationSchema.index({ expiresAt: 1 }, { sparse: true });

// Index for cleanup of deleted notifications
notificationSchema.index({ markedForDeletion: 1, updatedAt: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);
