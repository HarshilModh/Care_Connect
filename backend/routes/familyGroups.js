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
import { isValidID, isValidString } from "../utils/validation.utils.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    let { groupName, description, createdBy, members, timeZone, isPublic } =
      req.body;

    groupName = isValidString(groupName, "groupName");
    createdBy = isValidID(createdBy, "createdBy");

    if (description) {
      description = isValidString(description, "description");
    }
    if (timeZone) {
      timeZone = isValidString(timeZone, "timeZone");
    }

    const newGroup = await createFamilyGroup(
      groupName,
      description,
      createdBy,
      members,
      timeZone,
      isPublic
    );
    res.status(201).json({
      message: "Family group created successfully",
      familyGroup: newGroup,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

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
    const userId = isValidID(req.params.userId, "user ID");
    const familyGroups = await getFamilyGroupsByUserId(userId);
    res.status(200).json(familyGroups);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get("/creator/:userId", async (req, res) => {
  try {
    const userId = isValidID(req.params.userId, "user ID");
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
    const id = isValidID(req.params.id, "group ID");
    const familyGroup = await getFamilyGroupById(id);
    res.status(200).json(familyGroup);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.put("/group/:id", async (req, res) => {
  try {
    const id = isValidID(req.params.id, "group ID");
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
    const id = isValidID(req.params.id, "group ID");
    await deleteFamilyGroup(id);
    res
      .status(200)
      .json({ message: `Family group with ID ${id} deleted successfully` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/group/:id/members", async (req, res) => {
  try {
    const groupId = isValidID(req.params.id, "group ID");
    const { memberId } = req.body;

    if (!memberId) {
      throw new Error("Member ID is required");
    }

    const validMemberId = isValidID(memberId, "member ID");
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
    const id = isValidID(req.params.id, "group ID");
    const memberId = isValidID(req.params.memberId, "member ID");

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
    const id = isValidID(req.params.id, "group ID");
    const members = await getFamilyGroupMembers(id);
    res.status(200).json(members);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get("/group/:id/stats/members-count", async (req, res) => {
  try {
    const id = isValidID(req.params.id, "group ID");
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
    const id = isValidID(req.params.id, "group ID");
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
    const id = isValidID(req.params.id, "group ID");
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

export default router;
