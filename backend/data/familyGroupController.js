import { FamilyGroup } from "../models/familyGroups.model.js";
import {
  isValidArray,
  isValidID,
  isValidString,
} from "../utils/validation.utils.js";

//Data Functions

//Create Family Group
export const createFamilyGroup = async (
  groupName,
  description,
  createdBy,
  members,
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
  if (members && !isValidArray(members)) {
    throw new Error("Members must be an array");
  }
  if (timeZone && !isValidString(timeZone)) {
    throw new Error("Time zone must be a valid string");
  }
  if (isPublic !== undefined && typeof isPublic !== "boolean") {
    throw new Error("isPublic must be a boolean");
  }

  if (members && members.length > 0) {
    for (const memberId of members) {
      if (!isValidID(memberId)) {
        throw new Error(`Invalid member ID: ${memberId}`);
      }
    }
  }

  const familyGroupData = {
    groupName: groupName.trim().toLowerCase(),
    description: description ? description.trim() : "",
    createdBy,
    members: members || [],
    timeZone: timeZone || "UTC",
    isPublic: isPublic || false,
  };

  const newFamilyGroup = new FamilyGroup(familyGroupData);
  await newFamilyGroup.save();

  return newFamilyGroup;
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

//Add Member to Family Group
export const addMemberToFamilyGroup = async (groupId, memberId) => {
  if (!isValidID(groupId)) {
    throw new Error("Invalid group ID");
  }
  if (!isValidID(memberId)) {
    throw new Error("Invalid member ID");
  }

  const familyGroup = await FamilyGroup.findById(groupId);
  if (!familyGroup) {
    throw new Error("Family group not found");
  }

  const memberExists = familyGroup.members.some(
    (member) => member.toString() === memberId.toString()
  );

  if (memberExists) {
    throw new Error("Member already exists in this family group");
  }

  familyGroup.members.push(memberId);
  await familyGroup.save();

  return familyGroup;
};

//Remove Member from Family Group
export const removeMemberFromFamilyGroup = async (groupId, memberId) => {
  if (!isValidID(groupId)) {
    throw new Error("Invalid group ID");
  }
  if (!isValidID(memberId)) {
    throw new Error("Invalid member ID");
  }

  const familyGroup = await FamilyGroup.findById(groupId);
  if (!familyGroup) {
    throw new Error("Family group not found");
  }

  if (familyGroup.createdBy.toString() === memberId.toString()) {
    throw new Error("Cannot remove the creator from the family group");
  }

  const memberIndex = familyGroup.members.findIndex(
    (member) => member.toString() === memberId.toString()
  );

  if (memberIndex === -1) {
    throw new Error("Member not found in this family group");
  }

  familyGroup.members.splice(memberIndex, 1);
  await familyGroup.save();

  return familyGroup;
};

//Get Family Groups by User ID
export const getFamilyGroupsByUserId = async (userId) => {
  if (!isValidID(userId)) {
    throw new Error("Invalid user ID");
  }

  const familyGroups = await FamilyGroup.find({ members: userId }).sort({
    createdAt: -1,
  });

  return familyGroups;
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

//Get Family Group Members
export const getFamilyGroupMembers = async (groupId) => {
  if (!isValidID(groupId)) {
    throw new Error("Invalid group ID");
  }

  const familyGroup = await FamilyGroup.findById(groupId);

  if (!familyGroup) {
    throw new Error("Family group not found");
  }

  return familyGroup.members;
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

//Count Members in Family Group
export const countMembersInFamilyGroup = async (groupId) => {
  if (!isValidID(groupId)) {
    throw new Error("Invalid group ID");
  }

  const familyGroup = await FamilyGroup.findById(groupId);
  if (!familyGroup) {
    throw new Error("Family group not found");
  }

  return { count: familyGroup.members.length };
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
  const emptyGroups = await FamilyGroup.find({
    $or: [
      { members: { $size: 0 } },
      {
        members: { $size: 1 },
        $expr: { $eq: [{ $arrayElemAt: ["$members", 0] }, "$createdBy"] },
      },
    ],
  }).sort({ createdAt: -1 });

  return emptyGroups;
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
