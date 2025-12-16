import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
     title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      match: [
        /^(?=.*[a-zA-Z])[a-zA-Z0-9\s.,'!?()\-]+$/,
        "Title must contain at least one letter and can include letters, numbers, spaces, and basic punctuation.",
      ],
    },
    description: {
      type: String,
      trim: true,
      required: true,
      maxlength: 2000,
      default: "",
      match: [
        /^(?=.*[a-zA-Z])[a-zA-Z0-9\s.,'!?()\-]*$/,
        "Description must contain at least one letter and can include letters, numbers, spaces, and basic punctuation.",
      ],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    dueAt: {
      type: Date,
      required: false,
      default: null,
    },
    timezone: {
      type: String,
      default: "UTC",
      match: [
        /^[A-Za-z0-9_\-+]+(\/[A-Za-z0-9_\-+]+){0,2}$/,
        "Use a valid IANA time zone like America/New_York",
      ],
    },
    repeatRule: {
      type: String,
      trim: true,
      maxlength: 500,
      enum: ["daily","weekly","monthly",""],
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "missed"],
      default: "pending",
      index: true,
    },
    completedAt: {
      type: Date,
      required: false,
      default: null,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: ["task", "medication", "event", "note"],
      default: "task",
      index: true,
    },
    notificationConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    attachments: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }],
      default: [],
    },
  },
  { timestamps: true }
);

export const Task = mongoose.model("Task", taskSchema);
