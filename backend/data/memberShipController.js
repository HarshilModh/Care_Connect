import { Membership } from "../models/memberShip.model.js";
import { FamilyGroup } from "../models/familyGroups.model.js";
import User from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import { isValidID } from "../utils/validation.utils.js";
import { createNotification } from "./notificationController.js";
import mongoose from "mongoose";

//need to update role values in create and update functions
//Data Functions
//Create Membership

//role string [enum: owner, caregiver, family]
// status string [enum: active, pending, removed]

export const createMembership = async (
  groupId,
  userId,
  role,
  status,
  permissions,
  onboardingStatus
) => {
  try {
    console.log("groupId - createMembership", groupId);
    console.log("userId", userId);
    console.log("roles", role);
    if (!groupId || !userId) {
      throw new Error("Group ID and User ID are required");
    }
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid Group ID");
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid User ID");
    }

    const validRoles = [
      "admin",
      "careGiver",
      "familyMember",
      "readonly",
      "careRecipient",
    ];
    const validStatuses = ["active", "pending", "removed"];
    if (!validRoles.includes(role)) throw new Error("Invalid role value");
    if (!validStatuses.includes(status))
      throw new Error("Invalid status value");

    if (permissions && typeof permissions !== "object") {
      throw new Error("Permissions must be an object");
    }

    const rolesRequiringOnboarding = ["careGiver", "careRecipient"];
    if (!onboardingStatus) {
      onboardingStatus = rolesRequiringOnboarding.includes(role)
        ? "required"
        : "not_required";
    }

    const [group, user, existing] = await Promise.all([
      FamilyGroup.findById(groupId).lean(),
      User.findById(userId).lean(),
      Membership.findOne({ groupId, userId }).lean(),
    ]);
    if (!group) {
      throw new Error("Family group not found");
    }
    if (!user) {
      throw new Error("User not found");
    }
    if (existing) {
      throw new Error("Membership already exists for this user in the group");
    }
    //check if user is already in the group
    const isMember = await Membership.findOne({ groupId, userId });
    if (isMember) {
      throw new Error("User is already a member of this group");
    }

    const created = await Membership.create({
      groupId,
      userId,
      role,
      status,
      permissions: permissions || {},
      onboardingStatus
    });
    return created.toObject();
  } catch (error) {
    throw new Error("Error creating membership: " + error.message);
  }
};

//method to create multiple memberships at once
export const createMultipleMemberships = async (membershipsData) => {
  try {
    //validation
    if (
      !membershipsData ||
      !Array.isArray(membershipsData) ||
      membershipsData.length === 0
    ) {
      throw new Error("membershipsData must be a non-empty array");
    }
    for (const data of membershipsData) {
      const groupId = data.groupId;
      const userId = data.userId;
      const role = data.role;
      const status = data.status;
      const permissions = data.permissions;
      if (!groupId || !userId) {
        throw new Error(
          "Group ID and User ID are required for all memberships"
        );
      }
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        throw new Error("Invalid Group ID: " + groupId);
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid User ID: " + userId);
      }

      const validRoles = [
        "admin",
        "careGiver",
        "familyMember",
        "readonly",
        "careRecipient",
      ];
      const validStatuses = ["active", "pending", "removed"];
      if (!validRoles.includes(role))
        throw new Error("Invalid role value: " + role);
      if (!validStatuses.includes(status))
        throw new Error("Invalid status value: " + status);

      if (permissions && typeof permissions !== "object") {
        throw new Error("Permissions must be an object");
      }
      //check if user is already in the group
      const isMember = await Membership.findOne({ groupId, userId });
      if (isMember) {
        throw new Error(
          `User ${userId} is already a member of group ${groupId}`
        );
      }
    }
    const createdMemberships = await Membership.insertMany(membershipsData);
    return createdMemberships.map((membership) => membership.toObject());
  } catch (error) {
    throw new Error("Error creating multiple memberships: " + error.message);
  }
};

//demo bulk data [{"groupId": "691505376e046bce1b1fb793", "userId": "691426987001f75596136611", "role": "family", "status": "pending"},
//   {"groupId": "691505376e046bce1b1fb793", "userId": "691426a97001f7559613661c", "role": "family", "status": "pending"}
// ]

export const getMembershipById = async (membershipId) => {
  try {
    if (!membershipId) {
      throw new Error("Membership ID is required");
    }
    if (!isValidID(membershipId)) {
      throw new Error("Invalid membership ID");
    }

    const membership = await Membership.findById(membershipId).lean();
    return membership;
  } catch (error) {
    throw new Error("Error fetching membership: " + error.message);
  }
};

// prefer soft delete  keep this only if you truly want a hard delete
export const deleteMembership = async (membershipId) => {
  try {
    if (!membershipId) {
      throw new Error("Membership ID is required");
    }
    if (!isValidID(membershipId)) {
      throw new Error("Invalid membership ID");
    }

    // Delete the membership
    const deletedMembership = await Membership.findByIdAndDelete(membershipId);

    if (!deletedMembership) {
      throw new Error("Membership not found");
    }

    // Delete any notifications related to this membership
    const notificationResult = await Notification.deleteMany({
      membershipId: membershipId,
    });

    return {
      message: "Membership and related notifications deleted successfully",
      notificationsDeleted: notificationResult.deletedCount,
    };
  } catch (error) {
    console.log(error);
    throw new Error("Error deleting membership: " + error.message);
  }
}; //Update Membership
export const updateMembership = async (
  membershipId,
  groupId,
  userId,
  role,
  status,
  permissions
) => {
  try {
    if (!membershipId) {
      throw new Error("Membership ID is required");
    }
    if (!isValidID(membershipId)) {
      throw new Error("Invalid membership ID");
    }
    const updateData = {};
    if (groupId) {
      if (!isValidID(groupId)) {
        throw new Error("Invalid group ID");
      }
      updateData.groupId = groupId;
    }
    if (userId) {
      if (!isValidID(userId)) {
        throw new Error("Invalid user ID");
      }
      updateData.userId = userId;
    }
    if (role) {
      if (!["owner", "caregiver", "family"].includes(role)) {
        throw new Error("Invalid role value");
      }
      updateData.role = role;
    }
    if (status) {
      if (!["active", "pending", "removed"].includes(status)) {
        throw new Error("Invalid status value");
      }
      updateData.status = status;
    }
    if (permissions) {
      if (typeof permissions !== "object") {
        throw new Error("Permissions must be an object");
      }
      for (const key in permissions) {
        if (typeof permissions[key] !== "boolean") {
          throw new Error("Permission values must be boolean");
        }
      }
      updateData.permissions = permissions;
    }
    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields to update");
    }
    const updatedMembership = await Membership.findByIdAndUpdate(
      membershipId,
      updateData,
      { new: true }
    );

    // Send notification if status changed to 'active'
    if (updateData.status === "active" && updatedMembership) {
      try {
        await createNotification({
          type: "member_added",
          recipientId: updatedMembership.userId.toString(),
          groupId: updatedMembership.groupId.toString(),
          title: "Welcome to your Family Group!",
          message: "You have been added to the family group.",
          metadata: {},
        });
      } catch (notifErr) {
        console.error("Failed to create member added notification:", notifErr);
      }
    }
    return updatedMembership;
  } catch (error) {
    throw new Error("Error updating membership: " + error.message);
  }
};

//Get All Memberships
export const getAllMemberships = async () => {
  try {
    const memberships = await Membership.find();
    return memberships;
  } catch (error) {
    throw new Error("Error fetching memberships: " + error.message);
  }
};

//Get Memberships by User ID
export const getMembershipsByUserId = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!isValidID(userId)) {
      throw new Error("Invalid user ID");
    }
    const memberships = await Membership.find({ userId });
    return memberships;
  } catch (error) {
    throw new Error("Error fetching memberships: " + error.message);
  }
};

//Get Memberships by Group ID
export const getMembershipsByGroupId = async (groupId) => {
  try {
    if (!groupId) {
      throw new Error("Group ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid group ID");
    }
    const memberships = await Membership.find({ groupId }).populate(
      "userId",
      "firstName lastName email"
    );
    return memberships;
  } catch (error) {
    throw new Error("Error fetching memberships: " + error.message);
  }
};
//get members data by group id with user details populated
export const getMembersWithUserDetailsByGroupId = async (groupId) => {
  try {
    if (!groupId) {
      throw new Error("Group ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid group ID");
    }
    const memberships = await Membership.find({ groupId }).populate(
      "userId",
      "name email"
    );
    return memberships;
  } catch (error) {
    throw new Error(
      "Error fetching memberships with user details: " + error.message
    );
  }
};

//Update Membership Role
export const updateMembershipRole = async (membershipId, role) => {
  try {
    if (!membershipId) {
      throw new Error("Membership ID is required");
    }
    if (!isValidID(membershipId)) {
      throw new Error("Invalid membership ID");
    }
    if (!["owner", "caregiver", "family"].includes(role)) {
      throw new Error("Invalid role value");
    }
    const updatedMembership = await Membership.findByIdAndUpdate(
      membershipId,
      { role },
      { new: true }
    );
    return updatedMembership;
  } catch (error) {
    throw new Error("Error updating membership role: " + error.message);
  }
};

//Update Membership Status
export const updateMembershipStatus = async (membershipId, status) => {
  try {
    if (!membershipId) {
      throw new Error("Membership ID is required");
    }
    if (!isValidID(membershipId)) {
      throw new Error("Invalid membership ID");
    }
    if (!["active", "pending", "removed"].includes(status)) {
      throw new Error("Invalid status value");
    }
    const updatedMembership = await Membership.findByIdAndUpdate(
      membershipId,
      { status },
      { new: true }
    );
    return updatedMembership;
  } catch (error) {
    throw new Error("Error updating membership status: " + error.message);
  }
};

//Update Membership Permissions
export const updateMembershipPermissions = async (
  membershipId,
  permissions
) => { };

//Count Memberships in Group
export const countMembershipsInGroup = async (groupId) => {
  try {
    if (!groupId) {
      throw new Error("Group ID is required");
    }
    if (!isValidID(groupId)) {
      throw new Error("Invalid group ID");
    }
    const count = await Membership.countDocuments({ groupId });
    return count;
  } catch (error) {
    throw new Error("Error counting memberships: " + error.message);
  }
};

//Get Recent Memberships
export const getRecentMemberships = async (limit) => { };

//Search Memberships
export const searchMemberships = async (searchTerm) => { };

//Get Memberships by Role
export const getMembershipsByRole = async (role) => {
  try {
    const members = await Membership.find({ role });
    return members;
  } catch (error) {
    throw new Error("Error fetching memberships by role: " + error.message);
  }
};

//Get Active Memberships
export const getActiveMemberships = async () => {
  try {
    const activeMemberships = await Membership.find({ status: "active" });
    return activeMemberships;
  } catch (error) {
    throw new Error("Error fetching active memberships: " + error.message);
  }
};

//Get Pending Memberships
export const getPendingMemberships = async () => {
  try {
    const pendingMemberships = await Membership.find({ status: "pending" });
    return pendingMemberships;
  } catch (error) {
    throw new Error("Error fetching pending memberships: " + error.message);
  }
};

//Get Removed Memberships
export const getRemovedMemberships = async () => {
  try {
    const removedMemberships = await Membership.find({ status: "removed" });
    return removedMemberships;
  } catch (error) {
    throw new Error("Error fetching removed memberships: " + error.message);
  }
};
//Get Memberships with Specific Permission
export const getMembershipsWithPermission = async (
  permissionKey,
  permissionValue
) => { };
