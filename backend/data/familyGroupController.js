import { FamilyGroup } from "../models/familyGroups.model.js";
import {
  isValidArray,
  isValidID,
  isValidString,
} from "../utils/validation.utils.js";
import User from "../models/user.model.js";
import { createMembership, deleteMembership, getMembershipsByGroupId, getMembershipsByUserId, } from "./memberShipController.js";
import { Membership } from "../models/memberShip.model.js";
//Data Functions

//changes made here by Harshil Modh
//Create Family Group
export const createFamilyGroup = async (
  groupName,
  description,
  createdBy,
  timeZone,
  isPublic
) => {
  if (!isValidString(groupName)) {
    throw new Error("Group name is required and must be a valid string");
  }
  if (!isValidID(createdBy)) {
    throw new Error("Creator ID is required and must be valid");
  }

  if (description && !isValidString(description)) {
    throw new Error("Description must be a valid string");
  }

  if (timeZone && !isValidString(timeZone)) {
    throw new Error("Time zone must be a valid string");
  }
  if (isPublic !== undefined && typeof isPublic !== "boolean") {
    throw new Error("isPublic must be a boolean");
  }

  const familyGroupData = {
    groupName: groupName.trim().toLowerCase(),
    description: description ? description.trim() : "",
    createdBy,
    timeZone: timeZone || "UTC",
    isPublic: isPublic || false,
  };

  const newFamilyGroup = new FamilyGroup(familyGroupData);
  await newFamilyGroup.save();``
  //add creator as owner member
  const ownerMembership = await createMembership(
    newFamilyGroup._id,
    createdBy,
    'owner',
    'active'
  );
  
 let getCreatedGroup = await FamilyGroup.findById(newFamilyGroup._id).lean();
 let activeMemberships = await getMembershipsByGroupId(newFamilyGroup._id);
 //filter only active members
  activeMemberships = activeMemberships.filter(m => m.status === "active");
 getCreatedGroup.members = activeMemberships.map(m => m.userId); //view only field

  return getCreatedGroup;
};

//Get Family Group by ID
export const getFamilyGroupById = async (groupId) => {
  if (!isValidID(groupId)) {
    throw new Error("Invalid group ID");
  }

  const familyGroup = await FamilyGroup.findById(groupId);

  if (!familyGroup) {
    throw new Error("Family group not found");
  }

  return familyGroup;
};

//Update Family Group
export const updateFamilyGroup = async (groupId, updateData) => {
  if (!isValidID(groupId)) {
    throw new Error("Invalid group ID");
  }

  if (!updateData || typeof updateData !== "object") {
    throw new Error("Update data is required");
  }

  const { groupName, description, timeZone, isPublic } = updateData;
  const allowedUpdates = {};

  if (groupName !== undefined) {
    if (!isValidString(groupName)) {
      throw new Error("Group name must be a valid string");
    }
    allowedUpdates.groupName = groupName.trim().toLowerCase();
  }

  if (description !== undefined) {
    if (!isValidString(description)) {
      throw new Error("Description must be a valid string");
    }
    allowedUpdates.description = description.trim();
  }

  if (timeZone !== undefined) {
    if (!isValidString(timeZone)) {
      throw new Error("Time zone must be a valid string");
    }
    allowedUpdates.timeZone = timeZone.trim();
  }

  if (isPublic !== undefined) {
    if (typeof isPublic !== "boolean") {
      throw new Error("isPublic must be a boolean");
    }
    allowedUpdates.isPublic = isPublic;
  }

  const updatedGroup = await FamilyGroup.findByIdAndUpdate(
    groupId,
    { $set: allowedUpdates },
    { new: true, runValidators: true }
  );

  if (!updatedGroup) {
    throw new Error("Family group not found");
  }

  return updatedGroup;
};

//Delete Family Group
export const deleteFamilyGroup = async (groupId) => {
  if (!isValidID(groupId)) {
    throw new Error("Invalid group ID");
  }

  const deletedGroup = await FamilyGroup.findByIdAndDelete(groupId);

  if (!deletedGroup) {
    throw new Error("Family group not found");
  }

  return { message: "Family group deleted successfully", groupId };
};

//Get All Family Groups
export const getAllFamilyGroups = async () => {
  const familyGroups = await FamilyGroup.find().sort({ createdAt: -1 });

  return familyGroups;
};
//changes done here by Harshil Modh
//Add Member to Family Group
export const addMemberToFamilyGroup = async (groupId, memberId, role = "family") => {
  try {
    if (!isValidID(groupId)) {
      throw new Error("Invalid group ID");
    }
    if (!isValidID(memberId)) {
      throw new Error("Invalid member ID");
    }

    const [group, user] = await Promise.all([
      FamilyGroup.findById(groupId).lean(),
      User.findById(memberId).lean()
    ]);
    if (!group) throw new Error("Family group not found");
    if (!user) throw new Error("User not found");

    const existing = await Membership.findOne({ groupId, userId: memberId });
    if (existing && existing.status === "active") {
      throw new Error("User is already a member of this family group");
    }

    // upsert so re joining a removed or pending member becomes active
    await Membership.updateOne(
      { groupId, userId: memberId },
      {
        $set: { role, status: "active" },
        $setOnInsert: { joinedAt: new Date() }
      },
      { upsert: true }
    );

    const familyGroupAfterAdd = await FamilyGroup.findById(groupId).lean();
    const activeMemberships = await getMembershipsByGroupId(groupId);
    return {
      ...familyGroupAfterAdd,
      members: activeMemberships.map(m => m.userId)  // view only field
    };
  } catch (error) {
    throw new Error("Error adding member to family group: " + error.message);
  }
};
//changes done here by Harshil Modh
//Remove Member from Family Group
export const removeMemberFromFamilyGroup = async (groupId, memberId) => {
  try {
    if (!isValidID(groupId)) {
      throw new Error("Invalid group ID");
    }
    if (!isValidID(memberId)) {
      throw new Error("Invalid member ID");
    }

    const [group, user] = await Promise.all([
      FamilyGroup.findById(groupId).lean(),
      User.findById(memberId).lean()
    ]);
    if (!group) throw new Error("Family group not found");
    if (!user) throw new Error("User not found");

    const membership = await Membership.findOne({ groupId, userId: memberId });
    if (!membership || membership.status === "removed") {
      throw new Error("Member not found in family group");
    }

    // prevent removing the last owner if you use owner role
    if (membership.role === "owner") {
      const otherOwners = await Membership.countDocuments({
        groupId,
        role: "owner",
        status: "active",
        userId: { $ne: memberId }
      });
      if (otherOwners === 0) {
        throw new Error("Cannot remove the only owner of the group");
      }
    }

    await Membership.updateOne(
      { _id: membership._id },
      { $set: { status: "removed" } }
    );

    const familyGroupAfterRemove = await FamilyGroup.findById(groupId).lean();
    const activeMemberships = await getMembershipsByGroupId(groupId);
    return {
      ...familyGroupAfterRemove,
      members: activeMemberships.map(m => m.userId)  // view only field
    };
  } catch (error) {
    throw new Error("Error removing member from family group: " + error.message);
  }
};

//changes done here by Harshil Modh
//Get Family Groups by User ID
export const getFamilyGroupsByUserId = async (userId) => {
  try {
    if (!isValidID(userId)) {
      throw new Error("Invalid user ID");
    }

    const memberships = await getMembershipsByUserId(userId);
    const groupIds = memberships.map((m) => m.groupId);

    const familyGroups = await FamilyGroup.find({ _id: { $in: groupIds } }).sort({
      createdAt: -1,
    });

    return familyGroups;
  }
  catch (error) {
    throw new Error("Error getting family groups by user ID: " + error.message);
  }
};

//Search Family Groups
export const searchFamilyGroups = async (searchTerm) => {
  if (!isValidString(searchTerm)) {
    throw new Error("Search term must be a valid string");
  }

  const searchRegex = new RegExp(searchTerm.trim(), "i");

  const familyGroups = await FamilyGroup.find({
    $or: [{ groupName: searchRegex }, { description: searchRegex }],
  }).sort({ createdAt: -1 });

  return familyGroups;
};

//Get Public Family Groups
export const getPublicFamilyGroups = async () => {
  const publicGroups = await FamilyGroup.find({ isPublic: true }).sort({
    createdAt: -1,
  });

  return publicGroups;
};

//Get Family Groups by Time Zone
export const getFamilyGroupsByTimeZone = async (timeZone) => {
  if (!isValidString(timeZone)) {
    throw new Error("Time zone must be a valid string");
  }

  const familyGroups = await FamilyGroup.find({
    timeZone: timeZone.trim(),
  }).sort({ createdAt: -1 });

  return familyGroups;
};

//Update Family Group Visibility
export const updateFamilyGroupVisibility = async (groupId, isPublic) => {
  if (!isValidID(groupId)) {
    throw new Error("Invalid group ID");
  }
  if (typeof isPublic !== "boolean") {
    throw new Error("isPublic must be a boolean");
  }

  const updatedGroup = await FamilyGroup.findByIdAndUpdate(
    groupId,
    { $set: { isPublic } },
    { new: true, runValidators: true }
  );

  if (!updatedGroup) {
    throw new Error("Family group not found");
  }

  return updatedGroup;
};

//Get Family Groups by Name
export const getFamilyGroupsByName = async (groupName) => {
  if (!isValidString(groupName)) {
    throw new Error("Group name must be a valid string");
  }

  const familyGroups = await FamilyGroup.find({
    groupName: groupName.trim().toLowerCase(),
  }).sort({ createdAt: -1 });

  return familyGroups;
};

//changes done here by Harshil Modh
//Get Family Group Members
export const getFamilyGroupMembers = async (groupId) => {
  try {
    if (!isValidID(groupId)) {
      throw new Error("Invalid group ID");
    }

    const members= await getMembershipsByGroupId(groupId);
    //now we will ony return userIds of members with groupId
    const memberData ={groupId: groupId, members: members.map(m => m.userId)};
    return memberData;
  }
  catch (error) {
    throw new Error("Error getting family group members: " + error.message);
  }
};

//Update Family Group Time Zone
export const updateFamilyGroupTimeZone = async (groupId, timeZone) => {
  if (!isValidID(groupId)) {
    throw new Error("Invalid group ID");
  }
  if (!isValidString(timeZone)) {
    throw new Error("Time zone must be a valid string");
  }

  const updatedGroup = await FamilyGroup.findByIdAndUpdate(
    groupId,
    { $set: { timeZone: timeZone.trim() } },
    { new: true, runValidators: true }
  );

  if (!updatedGroup) {
    throw new Error("Family group not found");
  }

  return updatedGroup;
};

//Count Family Groups
export const countFamilyGroups = async () => {
  const count = await FamilyGroup.countDocuments();
  return { count };
};

//changes done here by Harshil Modh
//Count Members in Family Group
export const countMembersInFamilyGroup = async (groupId) => {
  try {
    if (!isValidID(groupId)) {
      throw new Error("Invalid group ID");
    }

    const count = await Membership.countDocuments({ groupId });
    return { groupId, memberCount: count };
  }
  catch (error) {
    throw new Error("Error counting members in family group: " + error.message);
  }
};

//Get Recent Family Groups
export const getRecentFamilyGroups = async (limit) => {
  const limitNum = parseInt(limit) || 10;

  if (limitNum < 1 || limitNum > 100) {
    throw new Error("Limit must be between 1 and 100");
  }

  const recentGroups = await FamilyGroup.find()
    .sort({ createdAt: -1 })
    .limit(limitNum);

  return recentGroups;
};

//Get Family Groups Created by User
export const getFamilyGroupsCreatedByUser = async (userId) => {
  if (!isValidID(userId)) {
    throw new Error("Invalid user ID");
  }

  const familyGroups = await FamilyGroup.find({ createdBy: userId }).sort({
    createdAt: -1,
  });

  return familyGroups;
};

//Get Family Groups with No Members
export const getFamilyGroupsWithNoMembers = async () => {
  try{
    const allGroups = await FamilyGroup.find();
    const groupsWithNoMembers = [];

    for(const group of allGroups){
        const memberCount = await Membership.countDocuments({ groupId: group._id });
        if(memberCount === 0){
            groupsWithNoMembers.push(group);
        }
    }

    return groupsWithNoMembers;
  }
  catch(error){
    throw new Error("Error fetching family groups with no members: " + error.message);
  }
};

//Get Family Groups by Creation Date Range
export const getFamilyGroupsByCreationDateRange = async (
  startDate,
  endDate
) => {
  if (!startDate || !endDate) {
    throw new Error("Start date and end date are required");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid date format");
  }

  if (start > end) {
    throw new Error("Start date must be before end date");
  }

  const familyGroups = await FamilyGroup.find({
    createdAt: {
      $gte: start,
      $lte: end,
    },
  }).sort({ createdAt: -1 });

  return familyGroups;
};
