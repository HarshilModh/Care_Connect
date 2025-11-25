import taskModel from "../models/task.model.js";
import { isValidString } from "../utils/validation.utils.js";
import User from "../models/user.model.js";
import { VALID_TYPES, VALID_STATUS, assertActiveMember, assertRecipientInGroup, sanitizeTimezone, uniqueObjectIds } from "../utils/taskHelper.js"
import mongoose from "mongoose";

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
    if (!["owner", "family"].includes(memberRole)) {
      throw new Error("User does not have permission to create tasks in this group");
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
      attachments
    });

    // Save to database
    const savedTask = await newTask.save();
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
export const updateTask = async (taskId, groupId, recipientId, createdBy, title, description, assignedTo, dueAt, timezone, repeatRule, type, notificationConfig, attachments) => {
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
      attachments
    };
    const updatedTask = await taskModel.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true }
    );
    return updatedTask;
  } catch (error) {
    throw new Error(`Error updating task: ${error.message}`);
  }
}
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
}

//markTaskCompleted
//need to change model to add completedBy field
export const markTaskCompleted = async (taskId, completedBy) => {
  try {
    if(!taskId) {
      throw new Error("Invalid or missing taskId");
    }
    //check if task exists
    if(!completedBy) {
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
    //check if completedBy is a group member
    const memberRole = await assertActiveMember(completedBy, task.groupId);
    //now only care takers can mark task as completed 
    if (memberRole !== "caregiver") {
      throw new Error("User does not have permission to mark task as completed");
    }
    //update task
    const updatedTask = await taskModel.findByIdAndUpdate(
      taskId,
      { status: 'completed', completedAt: new Date(), completedBy: completedBy },
      { new: true }
    );
    return updatedTask;
  } catch (error) {
    throw new Error(`Error marking task as completed: ${error.message}`);
  }
};

//reassignTask
export const reassignTask = async (taskId, newAssignee) => {
  try {
    if(!taskId) {
      throw new Error("Invalid or missing taskId");
    }
    if(!newAssignee) {
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

export const listMyTasks = async (groupId, userId, { status, from, to } =
  {}) => { };




//Methods to add later

//addAttachmentToTask and removeAttachmentFromTask can be added later
export const addAttachmentToTask = async (taskId, documentId) => { };
export const removeAttachmentFromTask = async (taskId, documentId) => { };

//listUpcomingDueTasks
export const listUpcomingDueTasks = async (groupId, withinMinutes = 60

) => { };