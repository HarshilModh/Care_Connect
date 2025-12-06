import cron from 'node-cron';
import { Task } from '../models/task.model.js';

export const initCronJobs = () => {
    console.log('⏰ Initializing Cron Jobs...');

    // JOB 1: Recurring Task Creation
    // Run every hour
    // cron.schedule('0 * * * *', async () => {
    //     console.log('Running hourly recurring task check...');
    //     try {
    //         await processRecurringTasks();
    //     } catch (error) {
    //         console.error('Error in recurring task cron:', error);
    //     }
    // });

    // JOB 2: Mark Overdue Tasks as "Missed"
    // Run every minute
    // cron.schedule("* * * * *", async () => {
    //     console.log("Checking for overdue tasks to mark as missed...");
    //     try {
    //         await markOverdueTasksAsMissed();
    //     } catch (error) {
    //         console.error("Error in Job: Mark Overdue Tasks as Missed", error);
    //     }
    // });

    // // JOB 3: Send Task Reminders (Due in 24 hours)
    // // Runs every hour at minute 5
    // cron.schedule("5 * * * *", async () => {
    //     console.log("Running Job: Send Task Reminders");
    //     try {
    //         await sendTaskReminders();
    //     } catch (error) {
    //         console.error("Error in Job: Send Task Reminders", error);
    //     }
    // });

    // Run once on startup for dev convenience
    // processRecurringTasks();
    // markOverdueTasksAsMissed(); 
    // // JOB 4: Clear Old Notifications
    // // Runs daily at midnight
    // cron.schedule("0 0 * * *", async () => {
    //     console.log("Running Job: Clear Old Notifications");
    //     try {
    //         await clearOldNotifications();
    //     } catch (error) {
    //         console.error("Error in Job: Clear Old Notifications", error);
    //     }
    // });

};

const processRecurringTasks = async () => {
    const now = new Date();

    // Find tasks with a repeat rule
    const recurringTasks = await Task.find({
        repeatRule: { $in: ['daily', 'weekly', 'monthly'] },
        dueAt: { $gte: new Date(now.setDate(now.getDate() - 30)) }
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
                groupId: task.groupId
            });

            if (!exists) {
                console.log(`Creating next instance for task: ${task.title} due at ${nextDueDate}`);

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
                    status: 'pending'
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
            status: 'pending'
        },
        {
            $set: { status: 'missed' }
        }
    );
    console.log(`Marked ${overdueTasks.modifiedCount} tasks as missed.`);
};

const sendTaskReminders = async () => {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasksDue = await Task.find({
        dueAt: { $gte: now, $lte: in24Hours },
        status: "pending",
    }).lean();

    console.log(`Found ${tasksDue.length} tasks due in the next 24 hours.`);
    // Notification logic to be added later
};
const clearOldNotifications = async () => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 1); // 1 month ago

    // Assuming Notification is a Mongoose model
    const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate }
    });

    console.log(`Cleared ${result.deletedCount} old notifications.`);
}
const calculateNextDueDate = (currentDate, rule) => {
    const date = new Date(currentDate);
    if (rule === 'daily') {
        date.setDate(date.getDate() + 1);
    } else if (rule === 'weekly') {
        date.setDate(date.getDate() + 7);
    } else if (rule === 'monthly') {
        date.setMonth(date.getMonth() + 1);
    }
    return date;
};
