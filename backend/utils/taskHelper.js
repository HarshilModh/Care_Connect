import { Membership } from "../models/memberShip.model.js";
import { CareRecipient } from "../models/careRecipients.model.js";
import { isValidID, isValidString } from "./validation.utils.js";
import ObjectId from "mongoose";
import mongoose from "mongoose";

export const assertActiveMember = async (userId, groupId) => {
  const membership = await Membership.findOne({
    userId,
    groupId,
    status: "active",
  }).lean();
  if (!membership) {
    throw new Error("User is not an active member of the group");
  }
  return membership.role;
};

export const assertRecipientInGroup = async (recipientId, groupId) => {
  const recipient = await CareRecipient.findOne({
    _id: recipientId,
    groupId,
  }).lean();
  if (!recipient) {
    throw new Error("Care recipient does not belong to the specified group");
  }
  return recipient;
};

export const uniqueObjectIds = (arr = []) => {
  const ids = Array.from(new Set(arr.map((x) => x.toString())));
  return ids.map((id) => new mongoose.Types.ObjectId(id));
};

export const sanitizeTimezone = (tz) => {
  const re = /^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/;
  return re.test(tz || "") ? tz : "UTC";
};

export const VALID_TYPES = ["task", "medication", "event", "note"];
export const VALID_STATUS = ["pending", "completed", "missed"]; // consider adding "removed"
