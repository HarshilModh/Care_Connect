import { Chat } from "../models/chat.model.js";
import { Membership } from "../models/memberShip.model.js";
import { FamilyGroup } from "../models/familyGroups.model.js";
import mongoose from "mongoose";

/**
 * Send a new message to a group
 */
export const sendMessage = async (groupId, userId, message, meta = {}, io = null) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(groupId)) throw new Error("Invalid groupId");
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid userId");

    if (typeof message !== "string" || message.trim().length === 0) {
      throw new Error("Message must be a non-empty string");
    }
    if (message.trim().length > 3000) {
      throw new Error("Message exceeds maximum length of 3000 characters");
    }

    const group = await FamilyGroup.findById(groupId);
    if (!group) throw new Error("Group not found");

    const membershipRecord = await Membership.findOne({
      groupId,
      userId,
      status: "active"
    });
    if (!membershipRecord) throw new Error("User is not an active member of the group");

    const newMessage = new Chat({
      groupId: new mongoose.Types.ObjectId(groupId),
      senderId: new mongoose.Types.ObjectId(userId),
      message: message.trim(),
      meta,
      status: "sent",
      deleted: false
    });

    const savedMessage = await newMessage.save();
    await savedMessage.populate("senderId", "firstName lastName profilePicture displayName email");

    // 🔥 EMIT SOCKET EVENT TO ALL GROUP MEMBERS
    if (io) {
      io.to(`group:${groupId}`).emit("new-message", {
        message: savedMessage,
        groupId: groupId.toString(),
        timestamp: new Date()
      });
      console.log(`📨 Message emitted to group:${groupId}`);
    }

    return savedMessage;
  } catch (error) {
    throw new Error(`Error in sendMessage: ${error.message}`);
  }
};

/**
 * Get all messages for a group with pagination
 */
export const getMessagesByGroupId = async (groupId, userId, options = {}) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(groupId)) throw new Error("Invalid groupId");
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid userId");

    const group = await FamilyGroup.findById(groupId);
    if (!group) throw new Error("Group not found");

    const membershipRecord = await Membership.findOne({
      groupId,
      userId,
      status: "active"
    });
    if (!membershipRecord) throw new Error("User is not a member of the group");

    const limit = options.limit || 50;
    const skip = options.skip || 0;
    const sortOrder = options.sortOrder || 1;

    const messages = await Chat.find({ groupId })
      .populate("senderId", "firstName lastName profilePicture displayName email role")
      .sort({ createdAt: sortOrder })
      .limit(limit)
      .skip(skip)
      .lean();

    const totalCount = await Chat.countDocuments({ groupId });

    return {
      messages,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + messages.length < totalCount
      }
    };
  } catch (error) {
    throw new Error(`Error in getMessagesByGroupId: ${error.message}`);
  }
};

/**
 * Get recent messages (last N messages)
 */
export const getRecentMessages = async (groupId, userId, limit = 50) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(groupId)) throw new Error("Invalid groupId");
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid userId");

    const membershipRecord = await Membership.findOne({
      groupId,
      userId,
      status: "active"
    });
    if (!membershipRecord) throw new Error("User is not a member of the group");

    const messages = await Chat.find({ groupId })
      .populate("senderId", "firstName lastName profilePicture displayName")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return messages.reverse();
  } catch (error) {
    throw new Error(`Error in getRecentMessages: ${error.message}`);
  }
};

/**
 * Update message status (sent -> delivered -> read)
 */
export const updateMessageStatus = async (messageId, userId, status) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(messageId)) throw new Error("Invalid messageId");
    if (!["sent", "delivered", "read"].includes(status)) {
      throw new Error("Invalid status. Must be 'sent', 'delivered', or 'read'");
    }

    const message = await Chat.findById(messageId);
    if (!message) throw new Error("Message not found");

    const membershipRecord = await Membership.findOne({
      groupId: message.groupId,
      userId,
      status: "active"
    });
    if (!membershipRecord) throw new Error("User is not a member of the group");

    message.status = status;

    if (status === "delivered") {
      const alreadyDelivered = message.deliveredTo?.some(
        (r) => r.userId.toString() === userId.toString()
      );
      if (!alreadyDelivered) {
        message.deliveredTo.push({ userId, at: new Date() });
      }
    }
    if (status === "read") {
      const alreadyRead = message.readBy?.some(
        (r) => r.userId.toString() === userId.toString()
      );
      if (!alreadyRead) {
        message.readBy.push({ userId, at: new Date() });
      }
    }

    await message.save();
    return message;
  } catch (error) {
    throw new Error(`Error in updateMessageStatus: ${error.message}`);
  }
};

/**
 * Mark all messages in a group as read for a user
 */
export const markAllAsRead = async (groupId, userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(groupId)) throw new Error("Invalid groupId");
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid userId");

    const membershipRecord = await Membership.findOne({
      groupId,
      userId,
      status: "active"
    });
    if (!membershipRecord) throw new Error("User is not a member of the group");

    const result = await Chat.updateMany(
      {
        groupId,
        senderId: { $ne: userId },
        deleted: { $ne: true },
        readBy: { $not: { $elemMatch: { userId } } }
      },
      {
        $push: { readBy: { userId, at: new Date() } },
        $set: { status: "read" }
      }
    );

    return {
      modifiedCount: result.modifiedCount,
      message: `${result.modifiedCount} messages marked as read`
    };
  } catch (error) {
    throw new Error(`Error in markAllAsRead: ${error.message}`);
  }
};

/**
 * Get unread message count for a user in a group
 */
export const getUnreadCount = async (groupId, userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(groupId)) throw new Error("Invalid groupId");
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid userId");

    const membershipRecord = await Membership.findOne({
      groupId,
      userId,
      status: "active"
    });
    if (!membershipRecord) throw new Error("User is not a member of the group");

    const count = await Chat.countDocuments({
      groupId,
      senderId: { $ne: userId },
      deleted: { $ne: true },
      readBy: { $not: { $elemMatch: { userId } } }
    });

    return count;
  } catch (error) {
    throw new Error(`Error in getUnreadCount: ${error.message}`);
  }
};

/**
 * Delete a message (soft delete via schema flag)
 */
export const deleteMessage = async (messageId, userId, io = null) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(messageId)) throw new Error("Invalid messageId");
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid userId");

    const message = await Chat.findById(messageId);
    if (!message) throw new Error("Message not found");

    if (message.senderId.toString() !== userId.toString()) {
      const membership = await Membership.findOne({
        groupId: message.groupId,
        userId,
        role: "admin",
        status: "active"
      });
      if (!membership) {
        throw new Error("Only message sender or group admin can delete messages");
      }
    }

    message.deleted = true;
    message.meta = {
      ...message.meta,
      deletedBy: userId,
      deletedAt: new Date()
    };

    await message.save();

    // 🔥 EMIT SOCKET EVENT FOR MESSAGE DELETION
    if (io) {
      io.to(`group:${message.groupId}`).emit("message-deleted", {
        messageId: message._id,
        groupId: message.groupId.toString(),
        timestamp: new Date()
      });
      console.log(`🗑️ Message deletion emitted to group:${message.groupId}`);
    }

    return message;
  } catch (error) {
    throw new Error(`Error in deleteMessage: ${error.message}`);
  }
};

/**
 * Edit a message (only by sender, within 15 minutes)
 */
export const editMessage = async (messageId, userId, newMessage, io = null) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(messageId)) throw new Error("Invalid messageId");
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid userId");
    if (typeof newMessage !== "string" || newMessage.trim().length === 0) {
      throw new Error("New message must be a non-empty string");
    }
    if (newMessage.trim().length > 3000) {
      throw new Error("Message exceeds maximum length of 3000 characters");
    }

    const message = await Chat.findById(messageId);
    if (!message) throw new Error("Message not found");
    if (message.deleted) throw new Error("Cannot edit a deleted message");

    if (message.senderId.toString() !== userId.toString()) {
      throw new Error("Only message sender can edit messages");
    }

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      throw new Error("Message can only be edited within 15 minutes of sending");
    }

    const editHistory = message.meta?.editHistory || [];
    editHistory.push({
      previousMessage: message.message,
      editedAt: new Date()
    });

    message.message = newMessage.trim();
    message.meta = {
      ...message.meta,
      edited: true,
      editHistory
    };

    await message.save();
    await message.populate("senderId", "firstName lastName profilePicture displayName");

    // 🔥 EMIT SOCKET EVENT FOR MESSAGE EDIT
    if (io) {
      io.to(`group:${message.groupId}`).emit("message-edited", {
        message,
        groupId: message.groupId.toString(),
        timestamp: new Date()
      });
      console.log(`✏️ Message edit emitted to group:${message.groupId}`);
    }

    return message;
  } catch (error) {
    throw new Error(`Error in editMessage: ${error.message}`);
  }
};

/**
 * Search messages in a group
 */
export const searchMessages = async (groupId, userId, searchQuery, options = {}) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(groupId)) throw new Error("Invalid groupId");
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid userId");
    if (typeof searchQuery !== "string" || searchQuery.trim().length === 0) {
      throw new Error("Search query must be a non-empty string");
    }

    const membershipRecord = await Membership.findOne({
      groupId,
      userId,
      status: "active"
    });
    if (!membershipRecord) throw new Error("User is not a member of the group");

    const limit = options.limit || 20;
    const skip = options.skip || 0;

    const messages = await Chat.find({
      groupId,
      message: { $regex: searchQuery, $options: "i" }
    })
      .populate("senderId", "firstName lastName profilePicture displayName")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const totalCount = await Chat.countDocuments({
      groupId,
      message: { $regex: searchQuery, $options: "i" }
    });

    return {
      messages,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + messages.length < totalCount
      }
    };
  } catch (error) {
    throw new Error(`Error in searchMessages: ${error.message}`);
  }
};

/**
 * Get message statistics for a group
 */
export const getGroupMessageStats = async (groupId, userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(groupId)) throw new Error("Invalid groupId");
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid userId");

    const membershipRecord = await Membership.findOne({
      groupId,
      userId,
      status: "active"
    });
    if (!membershipRecord) throw new Error("User is not a member of the group");

    const stats = await Chat.aggregate([
      { $match: { groupId: new mongoose.Types.ObjectId(groupId), deleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          uniqueSenders: { $addToSet: "$senderId" }
        }
      },
      {
        $project: {
          _id: 0,
          totalMessages: 1,
          uniqueSendersCount: { $size: "$uniqueSenders" }
        }
      }
    ]);

    const topContributors = await Chat.aggregate([
      { $match: { groupId: new mongoose.Types.ObjectId(groupId), deleted: { $ne: true } } },
      {
        $group: {
          _id: "$senderId",
          messageCount: { $sum: 1 }
        }
      },
      { $sort: { messageCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          messageCount: 1
        }
      }
    ]);

    return {
      ...(stats[0] || { totalMessages: 0, uniqueSendersCount: 0 }),
      topContributors
    };
  } catch (error) {
    throw new Error(`Error in getGroupMessageStats: ${error.message}`);
  }
};