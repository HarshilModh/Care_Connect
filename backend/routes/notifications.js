import express from "express";
import {
  createNotification,
  getUserNotifications,
  getNotificationById,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  markForDeletion,
  deleteNotification,
  acceptJoinRequest,
  rejectJoinRequest,
  cleanupExpiredNotifications,
  cleanupMarkedNotifications,
  sendJoinRequest,
} from "../data/notificationController.js";
import { isValidID } from "../utils/validation.utils.js";

const router = express.Router();

// Get all notifications for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!isValidID(userId)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }

    const filters = {};
    if (req.query.isRead !== undefined) {
      filters.isRead = req.query.isRead === "true";
    }
    if (req.query.type) {
      filters.type = req.query.type;
    }
    if (req.query.actionStatus) {
      filters.actionStatus = req.query.actionStatus;
    }

    const notifications = await getUserNotifications(userId, filters);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get unread count for a user
router.get("/user/:userId/unread-count", async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!isValidID(userId)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }

    const count = await getUnreadCount(userId);
    res.status(200).json(count);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get single notification by ID
router.get("/:id", async (req, res) => {
  try {
    const notificationId = req.params.id;

    if (!isValidID(notificationId)) {
      return res
        .status(400)
        .json({ error: "Valid notification ID is required" });
    }

    const notification = await getNotificationById(notificationId);
    res.status(200).json(notification);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Send join request (admin invites user to group)
router.post("/join-request", async (req, res) => {
  try {
    const { groupId, recipientId, senderId, message } = req.body;

    console.log("POST /join-request received:", {
      groupId,
      recipientId,
      senderId,
      message,
    });

    if (!groupId || !recipientId || !senderId) {
      return res.status(400).json({
        error: "groupId, recipientId, and senderId are required",
      });
    }

    if (!isValidID(groupId)) {
      return res.status(400).json({ error: "Valid group ID is required" });
    }

    if (!isValidID(recipientId)) {
      return res.status(400).json({ error: "Valid recipient ID is required" });
    }

    if (!isValidID(senderId)) {
      return res.status(400).json({ error: "Valid sender ID is required" });
    }

    const result = await sendJoinRequest(
      groupId,
      recipientId,
      senderId,
      message
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Accept join request
router.patch("/:id/accept", async (req, res) => {
  try {
    const notificationId = req.params.id;
    const { userId } = req.body;

    if (!isValidID(notificationId)) {
      return res
        .status(400)
        .json({ error: "Valid notification ID is required" });
    }

    if (!userId || !isValidID(userId)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }

    const result = await acceptJoinRequest(notificationId, userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reject join request
router.patch("/:id/reject", async (req, res) => {
  try {
    const notificationId = req.params.id;
    const { userId } = req.body;

    if (!isValidID(notificationId)) {
      return res
        .status(400)
        .json({ error: "Valid notification ID is required" });
    }

    if (!userId || !isValidID(userId)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }

    const result = await rejectJoinRequest(notificationId, userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const notificationId = req.params.id;
    const { userId } = req.body;

    if (!isValidID(notificationId)) {
      return res
        .status(400)
        .json({ error: "Valid notification ID is required" });
    }

    if (!userId || !isValidID(userId)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }

    const notification = await markAsRead(notificationId, userId);
    res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark all notifications as read for a user
router.patch("/user/:userId/read-all", async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!isValidID(userId)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }

    const result = await markAllAsRead(userId);
    res.status(200).json({
      message: "All notifications marked as read",
      ...result,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark notification for deletion
router.patch("/:id/mark-delete", async (req, res) => {
  try {
    const notificationId = req.params.id;
    const { userId } = req.body;

    if (!isValidID(notificationId)) {
      return res
        .status(400)
        .json({ error: "Valid notification ID is required" });
    }

    if (!userId || !isValidID(userId)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }

    const notification = await markForDeletion(notificationId, userId);
    res.status(200).json({
      message: "Notification marked for deletion",
      notification,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete notification permanently
router.delete("/:id", async (req, res) => {
  try {
    const notificationId = req.params.id;
    const { userId } = req.body;

    if (!isValidID(notificationId)) {
      return res
        .status(400)
        .json({ error: "Valid notification ID is required" });
    }

    if (!userId || !isValidID(userId)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }

    const result = await deleteNotification(notificationId, userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cleanup expired notifications (admin/cron job)
router.post("/cleanup/expired", async (req, res) => {
  try {
    const result = await cleanupExpiredNotifications();
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cleanup marked notifications (admin/cron job)
router.post("/cleanup/marked", async (req, res) => {
  try {
    const daysOld = req.body.daysOld || 30;
    const result = await cleanupMarkedNotifications(daysOld);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
