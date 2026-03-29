import express from "express";
import {
  createFamilyGroup,
  getFamilyGroupById,
  updateFamilyGroup,
  deleteFamilyGroup,
  getAllFamilyGroups,
  addMemberToFamilyGroup,
  removeMemberFromFamilyGroup,
  getFamilyGroupsByUserId,
  searchFamilyGroups,
  getPublicFamilyGroups,
  getFamilyGroupsByTimeZone,
  updateFamilyGroupVisibility,
  getFamilyGroupsByName,
  getFamilyGroupMembers,
  updateFamilyGroupTimeZone,
  countFamilyGroups,
  countMembersInFamilyGroup,
  getRecentFamilyGroups,
  getFamilyGroupsCreatedByUser,
  getFamilyGroupsWithNoMembers,
  getFamilyGroupsByCreationDateRange,
} from "../data/familyGroupController.js";
import { Membership } from "../models/memberShip.model.js";
import { createNotification, panicAlertNotification } from "../data/notificationController.js";
import mongoose from "mongoose";
import { panicAlertMessage } from "../data/chatController.js";
import { sendPanicAlertEmail } from "../integrations/nodemailer.js";// Change this line:
import { isValidString } from "../utils/validation.utils.js";
import User from "../models/user.model.js";
import { requireAuth, verifyFirebaseToken } from "../middlewares/auth.js";
const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    console.log("here in the post route");

    let { groupName, description, createdBy, isPublic } = req.body;
    console.log("create group route")
    console.log("groupName: ", groupName);
    console.log("createdBy: ", createdBy);
    console.log("isPublic", isPublic);

    if (!groupName || !createdBy) {
      console.log("groupName and createdBy are required");
      return res
        .status(400)
        .json({ error: "groupName and createdBy are required" });
    }
    if (typeof groupName !== "string") {
      console.log("groupName is not a string");
      return res.status(400).json({ error: "groupName must be a string" });
    }
    if (!isPublic) {
      isPublic = false;
    }
    if (typeof isPublic !== "boolean") {
      console.log("isPublic is not a boolean");
      return res.status(400).json({ error: "isPublic must be a boolean" });
    }
    groupName = isValidString(groupName, "groupName");
    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      console.log("createdby is not proper objectID");

      return res
        .status(400)
        .json({ error: "createdBy must be a valid ObjectId" });
    }
    if (description) {
      description = isValidString(description, "description");
    }
    groupName = groupName.toLowerCase().trim();
    description = description ? description.trim() : "";

    //check if family group with same name already exists
    const existingGroups = await getFamilyGroupsByName(groupName);
    console.log("existingGroups", existingGroups);
    if (existingGroups.length > 0) {
      //throw error with status code 409 - conflict
      res
        .status(409)
        .json({ error: "Family group with the same name already exists" });
      return;
    }

    const newGroup = await createFamilyGroup(
      groupName,
      description,
      createdBy,
      isPublic
    );
    res.status(201).json({
      message: "Family group created successfully",
      familyGroup: newGroup,
    });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).json({ error: error.message });
    return;
  }
});
//demo data for testing
//{ "groupName": "smith_family", "description": "Family group for the Smiths", "createdBy": "691424557001f755961365fe", "isPublic": true }

router.get("/", requireAuth, async (req, res) => {
  try {
    const familyGroups = await getAllFamilyGroups();
    res.status(200).json(familyGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Specific routes MUST come before /:id to avoid being caught by the dynamic parameter
router.get("/search/:searchTerm", requireAuth, async (req, res) => {
  try {
    const searchTerm = isValidString(req.params.searchTerm, "search term");
    if (searchTerm.length === 0) {
      return res
        .status(400)
        .json({ error: "Search term cannot be an empty string" });
    }
    const familyGroups = await searchFamilyGroups(searchTerm);
    res.status(200).json(familyGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/public/all", async (req, res) => {
  try {
    const publicGroups = await getPublicFamilyGroups();
    res.status(200).json(publicGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/user/:userId", requireAuth, async (req, res) => {
  try {
    let userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "User ID must be a valid ObjectId" });
    }
    console.log("getFamilyGroupsByUserId route", userId);
    const familyGroups = await getFamilyGroupsByUserId(userId);
    res.status(200).json(familyGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/creator/:userId", requireAuth, async (req, res) => {
  try {
    let userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "User ID must be a valid ObjectId" });
    }
    const familyGroups = await getFamilyGroupsCreatedByUser(userId);
    res.status(200).json(familyGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/name/:groupName", requireAuth, async (req, res) => {
  try {
    const groupName = isValidString(req.params.groupName, "group name");
    if (groupName.length === 0) {
      return res.status(400).json({ error: "Group name cannot be an empty string" });
    }
    const familyGroups = await getFamilyGroupsByName(groupName);

    res.status(200).json(familyGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/stats/count", requireAuth, async (req, res) => {
  try {
    const count = await countFamilyGroups();
    res.status(200).json(count);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/recent", requireAuth, async (req, res) => {
  try {
    const limit = 10;
    const recentGroups = await getRecentFamilyGroups(limit);
    res.status(200).json(recentGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/recent/:limit", requireAuth, async (req, res) => {
  try {
    const limit = req.params.limit || 10;
    const recentGroups = await getRecentFamilyGroups(limit);
    res.status(200).json(recentGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/filter/empty", requireAuth, async (req, res) => {
  try {
    const emptyGroups = await getFamilyGroupsWithNoMembers();
    res.status(200).json(emptyGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/filter/date-range", requireAuth, async (req, res) => {
  try {
    const startDate = isValidString(req.query.startDate, "start date");
    const endDate = isValidString(req.query.endDate, "end date");
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const familyGroups = await getFamilyGroupsByCreationDateRange(
      startDate,
      endDate
    );
    res.status(200).json(familyGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/group/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: "Group ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Group ID must be a valid ObjectId" });
    }
    const familyGroup = await getFamilyGroupById(id);
    res.status(200).json(familyGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/group/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: "Group ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Group ID must be a valid ObjectId" });
    }
    const updateData = { ...req.body };

    if (updateData.groupName) {
      updateData.groupName = isValidString(updateData.groupName, "groupName");
    }
    if (updateData.description) {
      updateData.description = isValidString(
        updateData.description,
        "description"
      );
    }
    if (updateData.timeZone) {
      updateData.timeZone = isValidString(updateData.timeZone, "timeZone");
    }

    const updatedGroup = await updateFamilyGroup(id, updateData);
    res.status(200).json({
      message: "Family group updated successfully",
      familyGroup: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/group/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      throw new Error("Group ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Group ID must be a valid ObjectId");
    }

    const result = await deleteFamilyGroup(id);

    res
      .status(200)
      .json({ message: `Family group with ID ${id} deleted successfully` });
  } catch (error) {
    console.error(`DELETE /group/${id} error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/group/:id/members", requireAuth, async (req, res) => {
  try {
    const groupId = req.params.id;
    if (!groupId) {
      throw new Error("Group ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error("Group ID must be a valid ObjectId");
    }
    const { memberId } = req.body;

    if (!memberId) {
      throw new Error("Member ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      throw new Error("Member ID must be a valid ObjectId");
    }
    const validMemberId = memberId;
    const updatedGroup = await addMemberToFamilyGroup(groupId, validMemberId);

    res.status(200).json({
      message: "Member added successfully",
      familyGroup: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/group/:id/members/:memberId", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: "Group ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Group ID must be a valid ObjectId" });
    }
    const memberId = req.params.memberId;
    if (!memberId) {
      return res.status(400).json({ error: "Member ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ error: "Member ID must be a valid ObjectId" });
    }

    const updatedGroup = await removeMemberFromFamilyGroup(id, memberId);
    res.status(200).json({
      message: "Member removed successfully",
      familyGroup: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/group/:id/members", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: "Group ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Group ID must be a valid ObjectId" });
    }
    const members = await getFamilyGroupMembers(id);
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/group/:id/stats/members-count", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: "Group ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Group ID must be a valid ObjectId" });
    }
    const count = await countMembersInFamilyGroup(id);
    res.status(200).json(count);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/timezone/:timeZone", async (req, res) => {
  try {
    const timeZone = isValidString(req.params.timeZone, "time zone");
    const familyGroups = await getFamilyGroupsByTimeZone(timeZone);
    res.status(200).json(familyGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/group/:id/visibility", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: "Group ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Group ID must be a valid ObjectId" });
    }
    if (!await getFamilyGroupById(id)) {
      return res.status(404).json({ error: "Family group not found" });
    }
    const { isPublic } = req.body;
    const updatedGroup = await updateFamilyGroupVisibility(id, isPublic);
    res.status(200).json({
      message: "Visibility updated successfully",
      familyGroup: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/group/:id/timezone", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: "Group ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Group ID must be a valid ObjectId" });
    }
    const timeZone = isValidString(req.body.timeZone, "time zone");

    const updatedGroup = await updateFamilyGroupTimeZone(id, timeZone);
    res.status(200).json({
      message: "Time zone updated successfully",
      familyGroup: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/group/:id/panic", requireAuth, async (req, res) => {
  try {
    let groupId = req.params.id;
    let { senderId } = req.body;
    console.log("Panic Alert Request Received:", { groupId, senderId });
    if (!groupId || !senderId) {
      return res.status(400).json({ error: "groupId and senderId are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: "groupId must be a valid ObjectId" });
    }
    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ error: "senderId must be a valid ObjectId" });
    }
    if (groupId === senderId) {
      return res.status(400).json({ error: "groupId and senderId cannot be the same" });
    }

    // 1. Get all other group members
    const members = await Membership.find({
      groupId,
      userId: { $ne: senderId },
      status: 'active'
    }).populate('userId');

    console.log(`Panic Alert triggered by ${senderId} for group ${groupId}`);

    // 2. Send Notifications
    groupId = groupId.toString();
    senderId = senderId.toString();
    await panicAlertNotification(groupId, senderId);

    console.log(`Panic Alert notifications sent to ${members.length} members`);
    // 3. Send chat messages
    await panicAlertMessage(groupId, senderId, members);
    // 4. Send Email alerts
    const groupName = (await getFamilyGroupById(groupId)).groupName;
    const sender = await User.findById(senderId);
    const senderName = sender ? `${sender.firstName} ${sender.lastName}` : "Unknown Sender";

    await Promise.all(members.map(async (member) => {
      const email = member.userId.email;
      if (email) {
        await sendPanicAlertEmail({
          to: email,
          alertDetails: {
            groupName,
            senderName,
            triggeredAt: new Date().toLocaleString()
          }
        });
      }
    }));


    console.log(`Panic Alert chat messages sent to ${members.length} members`);
    res.status(200).json({
      success: true,
      message: `Alert sent to ${members.length} members`
    });

  } catch (error) {
    console.error("Panic Route Error:", error);
    res.status(500).json({ error: error.message });
  }
});
//all routes for testing
//http://localhost:3000/api/family-groups/
//http://localhost:3000/api/family-groups/public/all
//http://localhost:3000/api/family-groups/user/:userId
//http://localhost:3000/api/family-groups/creator/:userId
//http://localhost:3000/api/family-groups/name/:groupName
//http://localhost:3000/api/family-groups/stats/count
//http://localhost:3000/api/family-groups/recent
//http://localhost:3000/api/family-groups/recent/:limit
//http://localhost:3000/api/family-groups/filter/empty
//http://localhost:3000/api/family-groups/filter/date-range?startDate=2023-01-01&endDate=2023-12-31
//http://localhost:3000/api/family-groups/group/:id
//http://localhost:3000/api/family-groups/group/:id/members
//http://localhost:3000/api/family-groups/group/:id/stats/members-count
//http://localhost:3000/api/family-groups/timezone/:timeZone
export default router;
