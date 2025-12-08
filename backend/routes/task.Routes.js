import {
  createTask,
  deleteTask,
  getTaskById,
  listGroupTasks,
  markTaskCompleted,
  reassignTask,
  updateTask,
  getTasksGroupedByGroup,
  getFilteredTasks,
} from "../data/taskController.js";
import { isValidString } from "../utils/validation.utils.js";
import { FamilyGroup } from "../models/familyGroups.model.js";
import User from "../models/user.model.js";
import { Task as taskModel } from "../models/task.model.js";

import express from "express";
import { Membership } from "../models/memberShip.model.js";
import { uploadFileToS3 } from "../integrations/s3.js";
import multer from "multer";
import mongoose from "mongoose";
const router = express.Router();

//fix values if needed in future
//   type: {
//     type: String,
//     enum: ['task', 'medication', 'event', 'note'],
//     default: 'task',
//     index: true
// },
// status: {
//     type: String,
//     enum: ['pending', 'completed', 'missed'],
//     default: 'pending',
//     index: true
// },

const upload = multer({
  storage: multer.memoryStorage(),
});

const uploadDataFiles = upload.array("dataFiles");

//Create Task
router.post("/", uploadDataFiles, async (req, res) => {
  try {
    let {
      groupId,
      recipientId,
      createdBy,
      title,
      description,
      assignedTo,
      dueAt,
      timezone,
      repeatRule,
      type,
      notificationConfig,
      attachments,
      status,
    } = req.body;
    if (!groupId) {
      return res.status(400).json({ error: "Group ID is required" });
    }
    if (!recipientId) {
      return res.status(400).json({ error: "Recipient ID is required" });
    }
    if (!createdBy) {
      return res.status(400).json({ error: "Created By ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: "Invalid Group ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ error: "Invalid Recipient ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({ error: "Invalid Created By ID" });
    }
    if (assignedTo) {
      if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
        return res.status(400).json({ error: "Invalid Assigned To ID" });
      }
    }
    if (type && !["task", "medication", "event", "note"].includes(type)) {
      return res.status(400).json({ error: "Invalid type value" });
    }
    if (type === undefined) {
      type = "task";
    }
    if (timezone === undefined) {
      timezone = "UTC";
    }
    if (!type) {
      type = "task";
    }
    if (!timezone) {
      timezone = "UTC";
    }
    if (repeatRule === undefined) {
      repeatRule = "";
    }
    if (!repeatRule) {
      repeatRule = "";
    }
    if (description === undefined) {
      description = "";
    }
    if (!description) {
      description = "";
    }
    if (!notificationConfig) {
      notificationConfig = {};
    }
    if (!attachments) {
      attachments = [];
    }
    if (!status) {
      status = "pending";
    }
    if (!["pending", "completed", "missed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    description = isValidString(description, "description");
    title = isValidString(title, "title");

    console.log("Files in request:", req.files);
    if (req.files && req.files.length > 0) {
      const filesToUpload = req.files;
      for (const file of filesToUpload) {
        const { documentId } = await uploadFileToS3(file, groupId, createdBy);
        attachments.push(documentId);
      }
    }

    const groupExists = await FamilyGroup.findById(groupId);
    if (!groupExists) {
      return res.status(404).json({ error: "Group not found" });
    }
    //check if recipient exists
    const recipientExists = await User.findById(recipientId);
    if (!recipientExists) {
      return res.status(404).json({ error: "Recipient user not found" });
    }
    //check if createdBy exists
    const creatorExists = await User.findById(createdBy);
    if (!creatorExists) {
      return res.status(404).json({ error: "Creator user not found" });
    }
    //chek if assignedTo exists
    if (assignedTo) {
      const assigneeExists = await User.findById(assignedTo);
      if (!assigneeExists) {
        return res.status(404).json({ error: "Assignee user not found" });
      }
    }
    //check if createdBy,recipient,assignee is a member of the group
    const [creatorMember, recipientMember, assigneeMember] = await Promise.all([
      Membership.findOne({
        groupId: groupId,
        userId: createdBy,
        status: "active",
      }),
      Membership.findOne({
        groupId: groupId,
        userId: recipientId,
        status: "active",
      }),
      assignedTo
        ? Membership.findOne({
            groupId: groupId,
            userId: assignedTo,
            status: "active",
          })
        : null,
    ]);
    if (!creatorMember) {
      return res
        .status(403)
        .json({ error: "Creator is not an active member of the group" });
    }
    if (!recipientMember) {
      return res
        .status(403)
        .json({ error: "Recipient is not an active member of the group" });
    }
    if (assignedTo && !assigneeMember) {
      return res
        .status(403)
        .json({ error: "Assignee is not an active member of the group" });
    }
    //create task
    const newTask = await createTask(
      groupId,
      recipientId,
      createdBy,
      title,
      description,
      assignedTo,
      dueAt,
      timezone,
      repeatRule,
      type,
      notificationConfig,
      attachments,
      status
    );
    res.status(200).json(newTask);

    // TODO: Update the taskId in the document created for the attachments if any.
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const {
      userId,
      query,
      status,
      type,
      priority,
      startDate,
      endDate,
      sortDue,
    } = req.query;

    console.log("Search Tasks called with params:", req.query);

    const tasks = await getFilteredTasks({
      userId,
      query,
      status,
      type,
      priority,
      startDate,
      endDate,
      sortDue: sortDue === "true",
    });

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

//Get Task by ID
router.get("/:taskId", async (req, res) => {
  try {
    let taskId = req.params.taskId;
    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: "Invalid Task ID" });
    }
    //check if task exists
    const taskExists = await getTaskById(taskId);
    if (!taskExists) {
      return res.status(404).json({ error: "Task not found" });
    }
    const task = await getTaskById(taskId);
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//Update Task
router.put("/:taskId", async (req, res) => {
  try {
    let taskId = req.params.taskId;
    let {
      groupId,
      recipientId,
      createdBy,
      title,
      description,
      assignedTo,
      dueAt,
      timezone,
      repeatRule,
      type,
      notificationConfig,
      attachments,
    } = req.body;
    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }
    if (!groupId) {
      return res.status(400).json({ error: "Group ID is required" });
    }
    if (!recipientId) {
      return res.status(400).json({ error: "Recipient ID is required" });
    }
    if (!createdBy) {
      return res.status(400).json({ error: "Created By ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: "Invalid Task ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: "Invalid Group ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ error: "Invalid Recipient ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({ error: "Invalid Created By ID" });
    }
    if (assignedTo) {
      if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
        return res.status(400).json({ error: "Invalid Assigned To ID" });
      }
    }
    if (type && !["task", "medication", "event", "note"].includes(type)) {
      return res.status(400).json({ error: "Invalid type value" });
    }
    if (type === undefined) {
      type = "task";
    }
    if (!type) {
      type = "task";
    }
    if (timezone === undefined) {
      timezone = "UTC";
    }
    if (!timezone) {
      timezone = "UTC";
    }
    if (repeatRule === undefined) {
      repeatRule = "";
    }
    if (!repeatRule) {
      repeatRule = "";
    }
    if (description === undefined) {
      description = "";
    }
    if (!description) {
      description = "";
    }
    if (!notificationConfig) {
      notificationConfig = {};
    }
    if (!attachments) {
      attachments = [];
    }
    description = isValidString(description, "description");
    title = isValidString(title, "title");
    //check if task exists
    const taskExists = await getTaskById(taskId);
    if (!taskExists) {
      return res.status(404).json({ error: "Task not found" });
    }
    //check if group exists
    const groupExists = await FamilyGroup.findById(groupId);
    if (!groupExists) {
      return res.status(404).json({ error: "Group not found" });
    }
    //check if recipient exists
    const recipientExists = await User.findById(recipientId);
    if (!recipientExists) {
      return res.status(404).json({ error: "Recipient user not found" });
    }
    //check if createdBy exists
    const creatorExists = await User.findById(createdBy);
    if (!creatorExists) {
      return res.status(404).json({ error: "Creator user not found" });
    }
    //chek if assignedTo exists
    if (assignedTo) {
      const assigneeExists = await User.findById(assignedTo);
      if (!assigneeExists) {
        return res.status(404).json({ error: "Assignee user not found" });
      }
    }
    //check if createdBy,recipient,assignee is a member of the group
    const [creatorMember, recipientMember, assigneeMember] = await Promise.all([
      Membership.findOne({
        groupId: groupId,
        userId: createdBy,
        status: "active",
      }),
      Membership.findOne({
        groupId: groupId,
        userId: recipientId,
        status: "active",
      }),
      assignedTo
        ? Membership.findOne({
            groupId: groupId,
            userId: assignedTo,
            status: "active",
          })
        : null,
    ]);
    if (!creatorMember) {
      return res
        .status(403)
        .json({ error: "Creator is not an active member of the group" });
    }
    if (!recipientMember) {
      return res
        .status(403)
        .json({ error: "Recipient is not an active member of the group" });
    }
    if (assignedTo && !assigneeMember) {
      return res
        .status(403)
        .json({ error: "Assignee is not an active member of the group" });
    }
    //update task
    const updatedTask = await updateTask(
      taskId,
      groupId,
      recipientId,
      createdBy,
      title,
      description,
      assignedTo,
      dueAt,
      timezone,
      repeatRule,
      type,
      notificationConfig,
      attachments
    );
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//Delete Task
router.delete("/:taskId", async (req, res) => {
  try {
    let taskId = req.params.taskId;
    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: "Invalid Task ID" });
    }
    //check if task exists
    const taskExists = await getTaskById(taskId);
    if (!taskExists) {
      return res.status(404).json({ error: "Task not found" });
    }
    const deletedTask = await deleteTask(taskId);
    res.status(200).json({ message: "Task deleted successfully", deletedTask });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//listGroupTasks
router.get("/group/:groupId", async (req, res) => {
  try {
    let groupId = req.params.groupId;
    if (!groupId) {
      return res.status(400).json({ error: "Group ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: "Invalid Group ID" });
    }
    //check if group exists
    const groupExists = await FamilyGroup.findById(groupId);
    if (!groupExists) {
      return res.status(404).json({ error: "Group not found" });
    }
    //list tasks
    const tasks = await listGroupTasks(groupId);
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//markTaskCompleted
router.post("/:taskId/complete", async (req, res) => {
  try {
    console.log("Mark Task Completed called");
    let taskId = req.params.taskId;
    let { completedBy } = req.body;
    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }
    if (!completedBy) {
      return res.status(400).json({ error: "Completed By ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: "Invalid Task ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(completedBy)) {
      return res.status(400).json({ error: "Invalid Completed By ID" });
    }
    //check if task exists
    const taskExists = await getTaskById(taskId);
    if (!taskExists) {
      return res.status(404).json({ error: "Task not found" });
    }
    //check if completedBy user exists
    const userExists = await User.findById(completedBy);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }
    //check if completedBy is a member of the group
    // const member = await Membership.findOne({
    //   groupId: groupId,
    //   userId: completedBy,
    //   status: "active",
    // });
    // if (!member) {
    //   return res
    //     .status(403)
    //     .json({ error: "User is not an active member of the group" });
    // }
    const completedTask = await markTaskCompleted(taskId, completedBy);
    res.status(200).json(completedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//reassignTask
router.post("/:taskId/reassign", async (req, res) => {
  try {
    let taskId = req.params.taskId;
    let { newAssignee } = req.body;
    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }
    if (!newAssignee) {
      return res.status(400).json({ error: "New Assignee ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: "Invalid Task ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(newAssignee)) {
      return res.status(400).json({ error: "Invalid New Assignee ID" });
    }

    //check if task exists
    const taskExists = await getTaskById(taskId);
    if (!taskExists) {
      return res.status(404).json({ error: "Task not found" });
    }
    //check if newAssignee user exists
    const userExists = await User.findById(newAssignee);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }
    //check if newAssignee is a member of the group
    const member = await Membership.findOne({
      groupId: taskExists.groupId,
      userId: newAssignee,
      status: "active",
    });
    if (!member) {
      return res
        .status(403)
        .json({ error: "User is not an active member of the group" });
    }
    const reassignedTask = await reassignTask(taskId, newAssignee);
    res.status(200).json(reassignedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res
      .status(400)
      .json({ error: "userId query parameter is required" });
  }
  try {
    const tasksByGroup = await getTasksGroupedByGroup(userId);
    res.status(200).json(tasksByGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
