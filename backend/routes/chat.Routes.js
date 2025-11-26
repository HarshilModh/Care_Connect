import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  sendMessage,
  getMessagesByGroupId,
  getRecentMessages,
  updateMessageStatus,
  markAllAsRead,
  getUnreadCount,
  deleteMessage,
  editMessage,
  searchMessages,
  getGroupMessageStats
} from "../data/chatController.js";

const router = express.Router();

router.use(requireAuth);

/**
 * @route   POST /api/chats/:groupId/messages
 * @desc    Send a new message to a group
 * @access  Private (Active group members only)
 */
router.post("/:groupId/messages", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { message, meta = {} } = req.body;
    const userId = req.user._id;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message is required and must be a non-empty string"
      });
    }

    const io = req.app.get("io");
    const newMessage = await sendMessage(groupId, userId, message, meta, io);

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage
    });
  } catch (error) {
    console.error("Error in POST /messages:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to send message"
    });
  }
});

/**
 * @route   GET /api/chats/:groupId/messages
 * @desc    Get all messages for a group with pagination
 * @access  Private (Active group members only)
 */
router.get("/:groupId/messages", async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const { limit, skip, sortOrder } = req.query;

    const options = {
      limit: limit ? parseInt(limit) : 50,
      skip: skip ? parseInt(skip) : 0,
      sortOrder: sortOrder ? parseInt(sortOrder) : 1
    };

    const result = await getMessagesByGroupId(groupId, userId, options);

    res.status(200).json({
      success: true,
      data: result.messages,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Error in GET /messages:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to retrieve messages"
    });
  }
});

/**
 * @route   GET /api/chats/:groupId/messages/recent
 * @desc    Get recent messages (last N messages)
 * @access  Private (Active group members only)
 */
router.get("/:groupId/messages/recent", async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    const messages = await getRecentMessages(groupId, userId, limit);

    res.status(200).json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (error) {
    console.error("Error in GET /messages/recent:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to retrieve recent messages"
    });
  }
});

/**
 * @route   GET /api/chats/:groupId/messages/search
 * @desc    Search messages in a group
 * @access  Private (Active group members only)
 */
router.get("/:groupId/messages/search", async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const { q: searchQuery, limit, skip } = req.query;

    if (!searchQuery || searchQuery.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const options = {
      limit: limit ? parseInt(limit) : 20,
      skip: skip ? parseInt(skip) : 0
    };

    const result = await searchMessages(groupId, userId, searchQuery, options);

    res.status(200).json({
      success: true,
      data: result.messages,
      pagination: result.pagination,
      searchQuery
    });
  } catch (error) {
    console.error("Error in GET /messages/search:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to search messages"
    });
  }
});

/**
 * @route   GET /api/chats/:groupId/stats
 * @desc    Get message statistics for a group
 * @access  Private (Active group members only)
 */
router.get("/:groupId/stats", async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const stats = await getGroupMessageStats(groupId, userId);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error in GET /stats:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to retrieve statistics"
    });
  }
});

/**
 * @route   GET /api/chats/:groupId/unread-count
 * @desc    Get unread message count for a user in a group
 * @access  Private (Active group members only)
 */
router.get("/:groupId/unread-count", async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const count = await getUnreadCount(groupId, userId);

    res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error("Error in GET /unread-count:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to retrieve unread count"
    });
  }
});

/**
 * @route   PATCH /api/chats/messages/:messageId/status
 * @desc    Update message status (sent -> delivered -> read)
 * @access  Private (Group members only)
 */
router.patch("/messages/:messageId/status", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!status || !["sent", "delivered", "read"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required (sent, delivered, or read)"
      });
    }

    const updatedMessage = await updateMessageStatus(messageId, userId, status);

    res.status(200).json({
      success: true,
      message: "Message status updated successfully",
      data: updatedMessage
    });
  } catch (error) {
    console.error("Error in PATCH /messages/status:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update message status"
    });
  }
});

/**
 * @route   PATCH /api/chats/:groupId/mark-all-read
 * @desc    Mark all messages in a group as read for current user
 * @access  Private (Active group members only)
 */
router.patch("/:groupId/mark-all-read", async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const result = await markAllAsRead(groupId, userId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error("Error in PATCH /mark-all-read:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to mark messages as read"
    });
  }
});

/**
 * @route   PUT /api/chats/messages/:messageId
 * @desc    Edit a message (only by sender, within 15 minutes)
 * @access  Private (Message sender only)
 */
router.put("/messages/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message is required and must be a non-empty string"
      });
    }

    const io = req.app.get("io");
    const updatedMessage = await editMessage(messageId, userId, message, io);

    res.status(200).json({
      success: true,
      message: "Message edited successfully",
      data: updatedMessage
    });
  } catch (error) {
    console.error("Error in PUT /messages:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to edit message"
    });
  }
});

/**
 * @route   DELETE /api/chats/messages/:messageId
 * @desc    Delete a message (soft delete by sender or admin)
 * @access  Private (Message sender or group admin)
 */
router.delete("/messages/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const io = req.app.get("io");
    const deletedMessage = await deleteMessage(messageId, userId, io);

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      data: deletedMessage
    });
  } catch (error) {
    console.error("Error in DELETE /messages:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete message"
    });
  }
});

export default router;