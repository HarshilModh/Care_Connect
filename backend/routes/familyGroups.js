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
import { isValidString } from "../utils/validation.utils.js";
import mongoose from "mongoose";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    console.log("here in the post route");

    let { groupName, description, createdBy, isPublic } = req.body;
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
    res.status(400).json({ error: error.message });
    return;
  }
});
//demo data for testing
//{ "groupName": "smith_family", "description": "Family group for the Smiths", "createdBy": "691424557001f755961365fe", "isPublic": true }

router.get("/", async (req, res) => {
  try {
    const familyGroups = await getAllFamilyGroups();
    res.status(200).json(familyGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Specific routes MUST come before /:id to avoid being caught by the dynamic parameter
router.get("/search/:searchTerm", async (req, res) => {
  try {
    const searchTerm = isValidString(req.params.searchTerm, "search term");
    const familyGroups = await searchFamilyGroups(searchTerm);
    res.status(200).json(familyGroups);
  } catch (error) {
    res.status(400).json({ error: error.message });
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

router.get("/user/:userId", async (req, res) => {
  try {
    let userId = req.params.userId;
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("User ID must be a valid ObjectId");
    }
    const familyGroups = await getFamilyGroupsByUserId(userId);
    res.status(200).json(familyGroups);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get("/creator/:userId", async (req, res) => {
  try {
    let userId = req.params.userId;
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("User ID must be a valid ObjectId");
    }
    const familyGroups = await getFamilyGroupsCreatedByUser(userId);
    res.status(200).json(familyGroups);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get("/name/:groupName", async (req, res) => {
  try {
    const groupName = isValidString(req.params.groupName, "group name");
    const familyGroups = await getFamilyGroupsByName(groupName);
    res.status(200).json(familyGroups);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/stats/count", async (req, res) => {
  try {
    const count = await countFamilyGroups();
    res.status(200).json(count);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/recent", async (req, res) => {
  try {
    const limit = 10;
    const recentGroups = await getRecentFamilyGroups(limit);
    res.status(200).json(recentGroups);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/recent/:limit", async (req, res) => {
  try {
    const limit = req.params.limit || 10;
    const recentGroups = await getRecentFamilyGroups(limit);
    res.status(200).json(recentGroups);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/filter/empty", async (req, res) => {
  try {
    const emptyGroups = await getFamilyGroupsWithNoMembers();
    res.status(200).json(emptyGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/filter/date-range", async (req, res) => {
  try {
    const startDate = isValidString(req.query.startDate, "start date");
    const endDate = isValidString(req.query.endDate, "end date");

    const familyGroups = await getFamilyGroupsByCreationDateRange(
      startDate,
      endDate
    );
    res.status(200).json(familyGroups);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/group/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      throw new Error("Group ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Group ID must be a valid ObjectId");
    }
    const familyGroup = await getFamilyGroupById(id);
    res.status(200).json(familyGroup);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.put("/group/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      throw new Error("Group ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Group ID must be a valid ObjectId");
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
    res.status(400).json({ error: error.message });
  }
});

router.delete("/group/:id", async (req, res) => {
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
    res.status(400).json({ error: error.message });
  }
});

router.post("/group/:id/members", async (req, res) => {
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
    res.status(400).json({ error: error.message });
  }
});

router.delete("/group/:id/members/:memberId", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      throw new Error("Group ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Group ID must be a valid ObjectId");
    }
    const memberId = req.params.memberId;
    if (!memberId) {
      throw new Error("Member ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      throw new Error("Member ID must be a valid ObjectId");
    }

    const updatedGroup = await removeMemberFromFamilyGroup(id, memberId);
    res.status(200).json({
      message: "Member removed successfully",
      familyGroup: updatedGroup,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/group/:id/members", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      throw new Error("Group ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Group ID must be a valid ObjectId");
    }
    const members = await getFamilyGroupMembers(id);
    res.status(200).json(members);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get("/group/:id/stats/members-count", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      throw new Error("Group ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Group ID must be a valid ObjectId");
    }
    const count = await countMembersInFamilyGroup(id);
    res.status(200).json(count);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get("/timezone/:timeZone", async (req, res) => {
  try {
    const timeZone = isValidString(req.params.timeZone, "time zone");
    const familyGroups = await getFamilyGroupsByTimeZone(timeZone);
    res.status(200).json(familyGroups);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch("/group/:id/visibility", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      throw new Error("Group ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Group ID must be a valid ObjectId");
    }
    const { isPublic } = req.body;
    const updatedGroup = await updateFamilyGroupVisibility(id, isPublic);
    res.status(200).json({
      message: "Visibility updated successfully",
      familyGroup: updatedGroup,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch("/group/:id/timezone", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      throw new Error("Group ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Group ID must be a valid ObjectId");
    }
    const timeZone = isValidString(req.body.timeZone, "time zone");

    const updatedGroup = await updateFamilyGroupTimeZone(id, timeZone);
    res.status(200).json({
      message: "Time zone updated successfully",
      familyGroup: updatedGroup,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
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
