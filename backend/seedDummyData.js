import mongoose from "mongoose";
import dotenv from "dotenv";
import { Vital } from "./models/vital.model.js";
import { Medication } from "./models/medication.model.js";
import { Task } from "./models/task.model.js";

dotenv.config();

const MONGODB_URI = "mongodb://127.0.0.1:27017/care_connect_dbCluster0";

const groupId = "69a4d8f1d5ed49456dd3078b";
const newUserId = "69a4ddee945b9fb47aeb5400";

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // Additional Vitals for new user (historical data)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        // Ensure we avoid creating EXACT duplicate entries if script runs multiple times
        // (We will just insert them for demonstration)
        /*
        const vitals = [
          { type: "bp", value: "122/80", unit: "mmHg", userId: newUserId, groupId, recordedAt: yesterday },
          { type: "heart_rate", value: "72", unit: "bpm", userId: newUserId, groupId, recordedAt: yesterday },
          { type: "glucose", value: "110", unit: "mg/dL", userId: newUserId, groupId, recordedAt: yesterday },
          { type: "bp", value: "125/82", unit: "mmHg", userId: newUserId, groupId, recordedAt: twoDaysAgo },
          { type: "heart_rate", value: "75", unit: "bpm", userId: newUserId, groupId, recordedAt: twoDaysAgo },
          { type: "temperature", value: "98.4", unit: "F", userId: newUserId, groupId, recordedAt: yesterday }
        ];
        await Vital.insertMany(vitals);
        console.log("Inserted additional historical vitals for new user");
        */

        // Additional Medications for new user
        const medications = [
            { name: "Levothyroxine", dosage: "50 mcg", frequency: "daily", groupId, recipientId: newUserId, instructions: "Take first thing in the morning on an empty stomach" },
            { name: "Metoprolol", dosage: "25 mg", frequency: "daily", groupId, recipientId: newUserId, instructions: "Take once daily with meals" },
            { name: "Albuterol Inhaler", dosage: "90 mcg", frequency: "as_needed", groupId, recipientId: newUserId, instructions: "Inhale 2 puffs every 4 to 6 hours as needed for shortness of breath" },
            { name: "Calcium and Vitamin D3", dosage: "600 mg", frequency: "daily", groupId, recipientId: newUserId, instructions: "Take twice daily with meals" } // Changed + to 'and' due to regex validation
        ];
        await Medication.insertMany(medications);
        console.log("Inserted additional medications for new user");

        // Tasks for new user
        const tasks = [
            { groupId, recipientId: newUserId, createdBy: "69a4d8c0d5ed49456dd30734", title: "Blood Test Appointment", description: "Fasting lipid panel and A1C at the lab", type: "event", status: "pending", dueAt: new Date(Date.now() + 86400000 * 2) },
            { groupId, recipientId: newUserId, createdBy: "69a4d8c0d5ed49456dd30734", title: "Physical Therapy", description: "Knee exercises session", type: "task", status: "pending", repeatRule: "weekly", dueAt: new Date(Date.now() + 86400000 * 3) }
        ];
        await Task.insertMany(tasks);
        console.log("Inserted dummy tasks for new user");

        console.log("Successfully seeded additional dummy data!");
    } catch (err) {
        console.error("Error seeding data:", err);
    } finally {
        mongoose.disconnect();
    }
};

seedData();
