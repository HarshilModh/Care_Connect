import { Task as taskModel } from "../models/task.model.js";
import { isValidString } from "../utils/validation.utils.js";
import User from "../models/user.model.js";
import {
  VALID_TYPES,
  VALID_STATUS,
  assertActiveMember,
  assertRecipientInGroup,
  sanitizeTimezone,
  uniqueObjectIds,
} from "../utils/taskHelper.js";
import mongoose from "mongoose";
import { createNotification } from "./notificationController.js";
import { FamilyGroup } from "../models/familyGroups.model.js";
import { meta } from "zod/v4/core";

export const createTask = async (
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
) => {
  // Validate inputs
  try {
    if (!groupId) {
      throw new Error("Invalid or missing groupId");
    }
    if (!recipientId) {
      throw new Error("Invalid or missing recipientId");
    }
    if (!createdBy) {
      throw new Error("Invalid or missing createdBy");
    }
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid groupId");
    }
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      throw new Error("Invalid recipientId");
    }
    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      throw new Error("Invalid createdBy");
    }
    title = isValidString(title, "title");
    description = isValidString(description, "description");
    // timezone = sanitizeTimezone(timezone);
    //if type is given then validate it
    if (type) {
      if (!VALID_TYPES.includes(type)) {
        throw new Error("Invalid task type");
      }
    }
    const memberRole = await assertActiveMember(createdBy, groupId);
    if (!["owner", "family", "admin"].includes(memberRole)) {
      throw new Error(
        "User does not have permission to create tasks in this group"
      );
    }
    // Assert care recipient belongs to group
    //will uncomment later after care recipient model is fixed
    // await assertRecipientInGroup(recipientId, groupId);
    // Create task object
    //There are already defaults in schema for assignedTo,timezone,type,notificationConfig,attachments
    //so only set them if they are provided
    const newTask = new taskModel({
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
    });

    // Save to database
    const savedTask = await newTask.save();

    try {
      await createNotification({
        type: "task_assigned",
        recipientId: assignedTo,
        senderId: createdBy,
        groupId: groupId,
        taskId: savedTask._id,
        title: `NEW TASK : ${title} `,
        message: `A new task "${title}" has been assigned to you.`,
        metaData: {},
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }

    return savedTask;
  } catch (error) {
    throw new Error(`Error creating task: ${error.message}`);
  }
};

export const getTaskById = async (taskId) => {
  if (!taskId) {
    throw new Error("taskId is required");
  }
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new Error("Invalid taskId");
  }
  const task = await taskModel.findById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }
  return task;
};
//we are getting all data to update the task
export const updateTask = async (
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
) => {
  try {
    if (!taskId) {
      throw new Error("taskId is required");
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new Error("Invalid taskId");
    }
    if (!groupId) {
      throw new Error("Invalid or missing groupId");
    }
    if (!recipientId) {
      throw new Error("Invalid or missing recipientId");
    }
    if (!createdBy) {
      throw new Error("Invalid or missing createdBy");
    }
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid groupId");
    }
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      throw new Error("Invalid recipientId");
    }
    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      throw new Error("Invalid createdBy");
    }

    title = isValidString(title, "title");
    description = isValidString(description, "description");

    //time zone validation can be added later

    const updateData = {
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
    };
    const updatedTask = await taskModel.findByIdAndUpdate(taskId, updateData, {
      new: true,
    });
    return updatedTask;
  } catch (error) {
    throw new Error(`Error updating task: ${error.message}`);
  }
};
// Delete task by ID
export const deleteTask = async (taskId) => {
  try {
    if (!taskId) {
      throw new Error("taskId is required");
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new Error("Invalid taskId");
    }
    await taskModel.findByIdAndDelete(taskId);
    return { message: "Task deleted successfully" };
  } catch (error) {
    throw new Error(`Error deleting task: ${error.message}`);
  }
};

export const markTaskCompleted = async (taskId, completedBy) => {
  try {
    if (!taskId) {
      throw new Error("Invalid or missing taskId");
    }
    if (!completedBy) {
      throw new Error("Invalid or missing completedBy");
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new Error("Invalid taskId");
    }
    if (!mongoose.Types.ObjectId.isValid(completedBy)) {
      throw new Error("Invalid completedBy");
    }
    const task = await taskModel.findById(taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    const memberRole = await assertActiveMember(completedBy, task.groupId);
    if (memberRole !== "caregiver" && memberRole !== "admin") {
      throw new Error(
        "User does not have permission to mark task as completed"
      );
    }
    const updatedTask = await taskModel.findByIdAndUpdate(
      taskId,
      {
        status: "completed",
        completedAt: new Date(),
        completedBy: completedBy,
      },
      { new: true }
    );
    return updatedTask;
  } catch (error) {
    throw new Error(`Error marking task as completed: ${error.message}`);
  }
};

export const getFilteredTasks = async ({
  userId,
  query,
  status,
  type,
  priority,
  startDate,
  endDate,
  sortDue,
}) => {
  if (!userId) throw new Error("User ID is required");

  const filter = { createdBy: userId };

  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  if (status) filter.status = status;
  if (type) filter.type = type;
  if (priority) filter.priority = priority;

  if (startDate || endDate) {
    filter.dueAt = {};
    if (startDate) filter.dueAt.$gte = new Date(startDate);
    if (endDate) filter.dueAt.$lte = new Date(endDate);
  }

  const queryBuilder = taskModel.find(filter);

  if (sortDue) queryBuilder.sort({ dueAt: 1 });

  return await queryBuilder.exec();
};

//reassignTask
export const reassignTask = async (taskId, newAssignee) => {
  try {
    if (!taskId) {
      throw new Error("Invalid or missing taskId");
    }
    if (!newAssignee) {
      throw new Error("Invalid or missing newAssignee");
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new Error("Invalid taskId");
    }
    if (!mongoose.Types.ObjectId.isValid(newAssignee)) {
      throw new Error("Invalid newAssignee");
    }
    const task = await taskModel.findById(taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    //check if newAssignee user exists
    const assigneeUser = await User.findById(newAssignee);
    if (!assigneeUser) {
      throw new Error("Assignee user not found");
    }
    //check if newAssignee is a member of the group
    await assertActiveMember(newAssignee, task.groupId);

    const updatedTask = await taskModel.findByIdAndUpdate(
      taskId,
      { assignedTo: newAssignee },
      { new: true }
    );
    return updatedTask;
  } catch (error) {
    throw new Error(`Error reassigning task: ${error.message}`);
  }
};

export const listGroupTasks = async (groupId) => {
  try {
    if (!groupId) {
      throw new Error("groupId is required");
    }
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid groupId");
    }
    const tasks = await taskModel.find({ groupId });
    return tasks;
  } catch (error) {
    throw new Error(`Error listing group tasks: ${error.message}`);
  }
};

export const listMyTasks = async (
  groupId,
  userId,
  { status, from, to } = {}
) => {};

//Methods to add later

//addAttachmentToTask and removeAttachmentFromTask can be added later
export const addAttachmentToTask = async (taskId, documentId) => {};
export const removeAttachmentFromTask = async (taskId, documentId) => {};

//listUpcomingDueTasks
export const listUpcomingDueTasks = async (groupId, withinMinutes = 60) => {};

export const getTasksGroupedByGroup = async (userId) => {
  try {
    const tasks = await taskModel
      .find({ assignedTo: userId, status: "pending" })
      .populate("groupId", "groupName")
      .exec();

    const groupedTasks = {};

    tasks.forEach((task) => {
      const groupId = task.groupId?._id?.toString() || "ungrouped";
      const groupName = task.groupId?.groupName || "Unknown Group";

      if (!groupedTasks[groupId]) {
        groupedTasks[groupId] = {
          groupName,
          tasks: [],
        };
      }

      groupedTasks[groupId].tasks.push(task);
    });

    return groupedTasks;
  } catch (err) {
    console.error("Error fetching tasks:", err);
    throw err;
  }
};
