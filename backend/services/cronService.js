import cron from "node-cron";
import { Task } from "../models/task.model.js";
import { Notification } from "../models/notification.model.js";
import { createNotification } from "../data/notificationController.js";
export const initCronJobs = () => {
  console.log("⏰ Initializing Cron Jobs...");

  // Job 1: Recurring Task Creation
  // Run daily at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily recurring task check...");
    try {
      await processRecurringTasks();
    } catch (error) {
      console.error("Error in recurring task cron:", error);
    }
  });

  // JOB 2: Mark Overdue Tasks as "Missed"
  // Run every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    console.log("Checking for overdue tasks to mark as missed...");
    try {
      await markOverdueTasksAsMissed();
    } catch (error) {
      console.error("Error in Job: Mark Overdue Tasks as Missed", error);
    }
  });

  // JOB 3: Send Task Reminders (Due in 5 mins and 0 mins)
  // Runs every minute
  cron.schedule("* * * * *", async () => {
    console.log("Running Job: Send Task Reminders");
    try {
      await sendTaskReminders();
    } catch (error) {
      console.error("Error in Job: Send Task Reminders", error);
    }
  });

  cron.schedule("0 0 * * *", async () => {
    console.log("Running Job: Clear Old Notifications");
    try {
      await clearOldNotifications();
    } catch (error) {
      console.error("Error in Job: Clear Old Notifications", error);
    }
  });
};

const processRecurringTasks = async () => {
  const now = new Date();

  // Find tasks with a repeat rule
  const recurringTasks = await Task.find({
    repeatRule: { $in: ["daily", "weekly", "monthly"] },
    dueAt: { $gte: new Date(now.setDate(now.getDate() - 30)) },
  });

  console.log(`Found ${recurringTasks.length} recurring tasks to check.`);

  for (const task of recurringTasks) {
    try {
      const nextDueDate = calculateNextDueDate(task.dueAt, task.repeatRule);

      // Check if the next instance already exists
      const exists = await Task.findOne({
        title: task.title,
        recipientId: task.recipientId,
        dueAt: nextDueDate,
        groupId: task.groupId,
      });

      if (!exists) {
        console.log(
          `Creating next instance for task: ${task.title} due at ${nextDueDate}`
        );

        // Clone the task
        const newTask = new Task({
          groupId: task.groupId,
          recipientId: task.recipientId,
          createdBy: task.createdBy,
          title: task.title,
          description: task.description,
          assignedTo: task.assignedTo,
          dueAt: nextDueDate,
          timezone: task.timezone,
          repeatRule: task.repeatRule,
          type: task.type,
          notificationConfig: task.notificationConfig,
          status: "pending",
        });

        await newTask.save();
      }
    } catch (err) {
      console.error(`Failed to process task ${task._id}:`, err);
    }
  }
};

const markOverdueTasksAsMissed = async () => {
  const now = new Date();
  const overdueTasks = await Task.updateMany(
    {
      dueAt: { $lt: now },
      status: "pending",
    },
    {
      $set: { status: "missed" },
    }
  );
  console.log(`Marked ${overdueTasks.modifiedCount} tasks as missed.`);
};

const sendTaskReminders = async () => {
  const now = new Date();
  const in4Mins = new Date(now.getTime() + 4 * 60 * 1000);
  const in5Mins = new Date(now.getTime() + 5 * 60 * 1000);
  const in1Min = new Date(now.getTime() + 1 * 60 * 1000);

  const tasksDueIn5Mins = await Task.find({
    dueAt: { $gt: in4Mins, $lte: in5Mins },
    status: "pending",
  }).lean();

  const tasksDueNow = await Task.find({
    dueAt: { $gt: now, $lte: in1Min },
    status: "pending",
  }).lean();

  console.log(`Found ${tasksDueIn5Mins.length} tasks due in 5 minutes.`);
  console.log(`Found ${tasksDueNow.length} tasks due now.`);

  for (const task of tasksDueIn5Mins) {
    try {
      const existingReminder = await Notification.findOne({
        taskId: task._id,
        type: "task_reminder",
        "metadata.reminderType": "5_minutes",
      });

      if (existingReminder) {
        console.log(`5-min reminder already sent for task: ${task.title}`);
        continue;
      }

      await createNotification({
        type: "task_reminder",
        recipientId: task.assignedTo.toString(),
        senderId: task.createdBy.toString(),
        groupId: task.groupId.toString(),
        taskId: task._id.toString(),
        title: `Task Due Soon: ${task.title}`,
        message: `Reminder: Task "${task.title}" is due in 5 minutes.`,
        metadata: { reminderType: "5_minutes" },
      });
      console.log(`Sent 5-min reminder for task: ${task.title}`);
    } catch (error) {
      console.error(
        `Failed to send 5-min reminder for task ${task._id}:`,
        error
      );
    }
  }

  for (const task of tasksDueNow) {
    try {
      const existingReminder = await Notification.findOne({
        taskId: task._id,
        type: "task_reminder",
        "metadata.reminderType": "due_now",
      });

      if (existingReminder) {
        console.log(`Due-now reminder already sent for task: ${task.title}`);
        continue;
      }

      const deletedCount = await Notification.deleteMany({
        taskId: task._id,
        type: "task_reminder",
        "metadata.reminderType": "5_minutes",
      });

      if (deletedCount.deletedCount > 0) {
        console.log(
          `Deleted ${deletedCount.deletedCount} 5-min reminder(s) for task: ${task.title}`
        );
      }

      await createNotification({
        type: "task_reminder",
        recipientId: task.assignedTo.toString(),
        senderId: task.createdBy.toString(),
        groupId: task.groupId.toString(),
        taskId: task._id.toString(),
        title: `Task Due Now: ${task.title}`,
        message: `Urgent: Task "${task.title}" is due now!`,
        metadata: { reminderType: "due_now" },
      });
      console.log(`Sent due-now reminder for task: ${task.title}`);
    } catch (error) {
      console.error(
        `Failed to send due-now reminder for task ${task._id}:`,
        error
      );
    }
  }
};
const clearOldNotifications = async () => {
  const cutoffDate = new Date();

  cutoffDate.setDate(cutoffDate.getDate() - 5);

  console.log(
    `Running notification cleanup. Cutoff: ${cutoffDate.toISOString()}`
  );

  try {
    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
    });
    console.log(`Cleared ${result.deletedCount} old notifications.`);
  } catch (error) {
    console.error("Error clearing notifications:", error);
  }
};
const calculateNextDueDate = (currentDate, rule) => {
  const date = new Date(currentDate);
  if (rule === "daily") {
    date.setDate(date.getDate() + 1);
  } else if (rule === "weekly") {
    date.setDate(date.getDate() + 7);
  } else if (rule === "monthly") {
    date.setMonth(date.getMonth() + 1);
  }
  return date;
};
