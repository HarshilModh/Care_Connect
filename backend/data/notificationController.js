import { Notification } from "../models/notification.model.js";
import { Membership } from "../models/memberShip.model.js";
import { FamilyGroup } from "../models/familyGroups.model.js";
import { Task } from "../models/task.model.js";
import { isValidID, isValidString } from "../utils/validation.utils.js";

// Create a notification
export const createNotification = async (notificationData) => {
  try {
    const {
      type,
      recipientId,
      senderId,
      groupId,
      membershipId,
      taskId,
      title,
      message,
      metadata,
      expiresAt,
    } = notificationData;

    if (
      !type ||
      ![
        "join_request",
        "task_reminder",
        "task_assigned",
        "task_completed",
        "group_update",
        "member_added",
        "member_removed",
        "system",
      ].includes(type)
    ) {
      throw new Error("Valid notification type is required");
    }

    if (!isValidID(recipientId)) {
      throw new Error("Valid recipient ID is required");
    }

    if (!isValidString(title)) {
      throw new Error("Title is required");
    }

    if (!isValidString(message)) {
      throw new Error("Message is required");
    }

    console.log("[DEBUG] Creating notification with data:", {
      type,
      recipientId,
      senderId,
      groupId,
      membershipId,
      taskId,
      title,
      message,
      metadata,
      expiresAt,
      actionStatus: type === "join_request" ? "pending" : null,
    });

    const notification = new Notification({
      type,
      recipientId,
      senderId: senderId || null,
      groupId: groupId || null,
      membershipId: membershipId || null,
      taskId: taskId || null,
      title: title.trim(),
      message: message.trim(),
      metadata: metadata || {},
      expiresAt: expiresAt || null,
      actionStatus: type === "join_request" ? "pending" : null,
    });

    const savedNotification = await notification.save();

    const returnNotification = await Notification.findById(
      savedNotification._id
    ).lean();
    console.log("[DEBUG] Notification created:", returnNotification);
    return returnNotification;
  } catch (error) {
    console.log(error);
    throw new Error("Error creating notification: " + error.message);
  }
};

// Get notifications for a user
export const getUserNotifications = async (userId, filters = {}) => {
  try {
    if (!isValidID(userId)) {
      throw new Error("Valid user ID is required");
    }

    const query = { recipientId: userId };

    if (filters.isRead !== undefined) {
      query.isRead = filters.isRead;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.actionStatus) {
      query.actionStatus = filters.actionStatus;
    }

    query.markedForDeletion = false;

    const notifications = await Notification.find(query)
      .populate("senderId", "firstName lastName email")
      .populate("groupId", "groupName description")
      .populate("taskId", "title description dueDate")
      .sort({ createdAt: -1 })
      .lean();

    return notifications;
  } catch (error) {
    console.log(error);
    throw new Error("Error getting user notifications: " + error.message);
  }
};

export const getNotificationById = async (notificationId) => {
  try {
    if (!isValidID(notificationId)) {
      throw new Error("Valid notification ID is required");
    }

    const notification = await Notification.findById(notificationId)
      .populate("senderId", "firstName lastName email")
      .populate("groupId", "groupName description")
      .populate("taskId", "title description dueDate")
      .lean();

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  } catch (error) {
    console.log(error);
    throw new Error("Error getting notification by ID: " + error.message);
  }
};

export const getUnreadCount = async (userId) => {
  try {
    if (!isValidID(userId)) {
      throw new Error("Valid user ID is required");
    }

    const count = await Notification.countDocuments({
      recipientId: userId,
      isRead: false,
      markedForDeletion: false,
    });

    return { count };
  } catch (error) {
    console.log(error);
    throw new Error("Error getting unread count: " + error.message);
  }
};

export const markAsRead = async (notificationId, userId) => {
  try {
    if (!isValidID(notificationId)) {
      throw new Error("Valid notification ID is required");
    }

    if (!isValidID(userId)) {
      throw new Error("Valid user ID is required");
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      throw new Error("Notification not found or unauthorized");
    }

    const returnNotification = await Notification.findById(
      notification._id
    ).lean();
    return returnNotification;
  } catch (error) {
    console.log(error);
    throw new Error("Error marking notification as read: " + error.message);
  }
};

export const markAllAsRead = async (userId) => {
  try {
    if (!isValidID(userId)) {
      throw new Error("Valid user ID is required");
    }

    const result = await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return { modifiedCount: result.modifiedCount };
  } catch (error) {
    console.log(error);
    throw new Error(
      "Error marking all notifications as read: " + error.message
    );
  }
};

export const markForDeletion = async (notificationId, userId) => {
  try {
    if (!isValidID(notificationId)) {
      throw new Error("Valid notification ID is required");
    }

    if (!isValidID(userId)) {
      throw new Error("Valid user ID is required");
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { $set: { markedForDeletion: true, isRead: true } },
      { new: true }
    );

    if (!notification) {
      throw new Error("Notification not found or unauthorized");
    }

    const returnNotification = await Notification.findById(
      notification._id
    ).lean();
    return returnNotification;
  } catch (error) {
    console.log(error);
    throw new Error(
      "Error marking notification for deletion: " + error.message
    );
  }
};

export const deleteNotification = async (notificationId, userId) => {
  try {
    if (!isValidID(notificationId)) {
      throw new Error("Valid notification ID is required");
    }

    if (!isValidID(userId)) {
      throw new Error("Valid user ID is required");
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipientId: userId,
    });

    if (!notification) {
      throw new Error("Notification not found or unauthorized");
    }

    return { message: "Notification deleted successfully" };
  } catch (error) {
    console.log(error);
    throw new Error("Error deleting notification: " + error.message);
  }
};

export const acceptJoinRequest = async (notificationId, userId) => {
  try {
    if (!isValidID(notificationId)) {
      throw new Error("Valid notification ID is required");
    }

    if (!isValidID(userId)) {
      throw new Error("Valid user ID is required");
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      recipientId: userId,
      type: "join_request",
      actionStatus: "pending",
    });

    if (!notification) {
      throw new Error(
        "Join request notification not found or already processed"
      );
    }

    if (!notification.membershipId || !notification.groupId) {
      throw new Error(
        "Invalid join request: missing membership or group reference"
      );
    }

    const membership = await Membership.findByIdAndUpdate(
      notification.membershipId,
      { $set: { status: "active" } },
      { new: true }
    );

    if (!membership) {
      throw new Error("Membership not found");
    }

    const group = await FamilyGroup.findById(notification.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    if (!group.members) {
      group.members = [];
    }

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }

    notification.actionStatus = "accepted";
    notification.isRead = true;
    await notification.save();

    const updatedNotification = await Notification.findById(
      notification._id
    ).lean();
    const updatedMembership = await Membership.findById(membership._id).lean();

    return {
      notification: updatedNotification,
      membership: updatedMembership,
      message: "Join request accepted successfully",
    };
  } catch (error) {
    console.log(error);
    throw new Error("Error accepting join request: " + error.message);
  }
};

export const rejectJoinRequest = async (notificationId, userId) => {
  try {
    if (!isValidID(notificationId)) {
      throw new Error("Valid notification ID is required");
    }

    if (!isValidID(userId)) {
      throw new Error("Valid user ID is required");
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      recipientId: userId,
      type: "join_request",
      actionStatus: "pending",
    });

    if (!notification) {
      throw new Error(
        "Join request notification not found or already processed"
      );
    }

    if (!notification.membershipId) {
      throw new Error("Invalid join request: missing membership reference");
    }

    const membership = await Membership.findByIdAndUpdate(
      notification.membershipId,
      { $set: { status: "removed" } },
      { new: true }
    );

    if (!membership) {
      throw new Error("Membership not found");
    }

    notification.actionStatus = "rejected";
    notification.isRead = true;
    await notification.save();

    const updatedNotification = await Notification.findById(
      notification._id
    ).lean();
    const updatedMembership = await Membership.findById(membership._id).lean();

    return {
      notification: updatedNotification,
      membership: updatedMembership,
      message: "Join request rejected successfully",
    };
  } catch (error) {
    console.log(error);
    throw new Error("Error rejecting join request: " + error.message);
  }
};

export const cleanupExpiredNotifications = async () => {
  try {
    const now = new Date();

    const result = await Notification.deleteMany({
      expiresAt: { $lt: now },
    });

    return {
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} expired notifications`,
    };
  } catch (error) {
    console.log(error);
    throw new Error(
      "Error cleaning up expired notifications: " + error.message
    );
  }
};

export const cleanupMarkedNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      markedForDeletion: true,
      updatedAt: { $lt: cutoffDate },
    });

    return {
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} old marked notifications`,
    };
  } catch (error) {
    console.log(error);
    throw new Error("Error cleaning up marked notifications: " + error.message);
  }
};

export const deleteNotificationsByGroupId = async (groupId) => {
  try {
    if (!isValidID(groupId)) {
      throw new Error("Valid group ID is required");
    }

    const memberships = await Membership.find({ groupId: groupId });
    const membershipIds = memberships.map((m) => m._id);

    const result = await Notification.deleteMany({
      $or: [{ groupId: groupId }, { membershipId: { $in: membershipIds } }],
    });

    return {
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} notifications for group`,
    };
  } catch (error) {
    console.log(error);
    throw new Error(
      "Error deleting notifications by groupId: " + error.message
    );
  }
};

export const sendJoinRequest = async (
  groupId,
  recipientId,
  senderId,
  message = ""
) => {
  try {
    if (!isValidID(groupId)) {
      throw new Error("Valid group ID is required");
    }

    if (!isValidID(recipientId)) {
      throw new Error("Valid recipient ID is required");
    }

    if (!isValidID(senderId)) {
      throw new Error("Valid sender ID is required");
    }

    const group = await FamilyGroup.findById(groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    if (group.createdBy.toString() !== senderId.toString()) {
      throw new Error("Only group creator can send join requests");
    }

    let membership = await Membership.findOne({
      groupId,
      userId: recipientId,
      status: "pending",
    });

    let notification;
    if (membership) {
      notification = await Notification.findOne({
        type: "join_request",
        recipientId,
        senderId,
        groupId,
        membershipId: membership._id,
      });
      if (!notification) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        notification = await createNotification({
          type: "join_request",
          recipientId,
          senderId,
          groupId,
          membershipId: membership._id,
          title: "Group Invitation",
          message:
            message || `You have been invited to join ${group.groupName}`,
          metadata: {
            groupName: group.groupName,
            inviterName: "Group Admin",
          },
          expiresAt,
        });
      }
      return {
        notification,
        membership,
        message: "Join request already pending, notification ensured.",
      };
    } else {
      membership = new Membership({
        groupId,
        userId: recipientId,
        role: "family",
        status: "pending",
      });
      await membership.save();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      notification = await createNotification({
        type: "join_request",
        recipientId,
        senderId,
        groupId,
        membershipId: membership._id,
        title: "Group Invitation",
        message: message || `You have been invited to join ${group.groupName}`,
        metadata: {
          groupName: group.groupName,
          inviterName: "Group Admin",
        },
        expiresAt,
      });
      const savedMembership = await Membership.findById(membership._id).lean();
      return {
        notification,
        membership: savedMembership,
        message: "Join request sent successfully",
      };
    }
  } catch (error) {
    console.log(error);
    throw new Error("Error sending join request: " + error.message);
  }
};
