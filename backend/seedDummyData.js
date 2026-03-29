import mongoose from "mongoose";
import dotenv from "dotenv";
import { FamilyGroup } from "./models/familyGroups.model.js";
import { Membership } from "./models/memberShip.model.js";
import { CareRecipient } from "./models/careRecipients.model.js";
import { Vital } from "./models/vital.model.js";
import { Medication } from "./models/medication.model.js";
import { Task } from "./models/task.model.js";
import { Chat } from "./models/chat.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/care_connect_dbCluster0";

// User IDs provided from fresh DB insertion
const user1Id = "69c99f34a88925a322f3dd87"; // harshilmodh77@gmail.com
const user2Id = "69c9a1096b1f1bd168a8ef64"; // harshilmodhapplication07@gmail.com
const user3Id = "69c9a1136b1f1bd168a8ef77"; // harshiludemy@gmail.com

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // 1. Create or Find Family Group
        let group = await FamilyGroup.findOne({ groupName: "harshil family" }); // groupName is lowercase in schema
        if (!group) {
            group = await FamilyGroup.findOne({ createdBy: user1Id });
        }
        
        let groupId;
        if (!group) {
            const newGroup = new FamilyGroup({
                groupName: "Harshil Family",
                description: "A group for Harshil family care",
                createdBy: user1Id
            });
            const savedGroup = await newGroup.save();
            groupId = savedGroup._id;
            console.log("Created Family Group with ID:", groupId);
        } else {
            groupId = group._id;
            console.log("Found existing Family Group with ID:", groupId);
        }

        // 2. Create Memberships for the users if they don't exist
        const checkAndCreateMembership = async (userId, role) => {
            const exists = await Membership.findOne({ groupId, userId });
            if (!exists) {
                await Membership.create({ groupId, userId, role, status: "active" });
            }
        };

        await checkAndCreateMembership(user1Id, "admin");
        await checkAndCreateMembership(user2Id, "careRecipient");
        await checkAndCreateMembership(user3Id, "careGiver");
        console.log("Memberships verified/created");

        // 3. Create CareRecipient profile for user2 if it doesn't exist
        const careRecipientExists = await CareRecipient.findOne({ groupId, userId: user2Id });
        if (!careRecipientExists) {
            const careRecipient = new CareRecipient({
                groupId,
                userId: user2Id,
                primaryCondition: "Hypertension and Type 2 Diabetes",
                notes: "Needs regular BP and Glucose monitoring",
                emergencyContacts: [
                    { name: "John Doe", phone: "1234567890", relation: "Friend" }
                ]
            });
            await careRecipient.save();
            console.log("Created CareRecipient record for user2");
        } else {
            console.log("CareRecipient record already exists for user2");
        }

        // 4. Seed MORE Vitals for user2 (Spread across last few days)
        const generateDate = (daysAgo) => {
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            return date;
        };

        const vitals = [
            // Today
            { type: "bp", value: "118/76", unit: "mmHg", userId: user2Id, groupId, recordedAt: generateDate(0) },
            { type: "glucose", value: "95", unit: "mg/dL", userId: user2Id, groupId, recordedAt: generateDate(0) },
            
            // 1 Day Ago
            { type: "bp", value: "122/80", unit: "mmHg", userId: user2Id, groupId, recordedAt: generateDate(1) },
            { type: "heart_rate", value: "72", unit: "bpm", userId: user2Id, groupId, recordedAt: generateDate(1) },
            { type: "glucose", value: "110", unit: "mg/dL", userId: user2Id, groupId, recordedAt: generateDate(1) },
            
            // 2 Days Ago
            { type: "bp", value: "125/82", unit: "mmHg", userId: user2Id, groupId, recordedAt: generateDate(2) },
            { type: "temperature", value: "98.6", unit: "F", userId: user2Id, groupId, recordedAt: generateDate(2) },
            
            // 3 Days Ago
            { type: "bp", value: "130/85", unit: "mmHg", userId: user2Id, groupId, recordedAt: generateDate(3) },
            { type: "heart_rate", value: "76", unit: "bpm", userId: user2Id, groupId, recordedAt: generateDate(3) },
            { type: "glucose", value: "115", unit: "mg/dL", userId: user2Id, groupId, recordedAt: generateDate(3) },

            // 4 Days Ago
            { type: "bp", value: "128/84", unit: "mmHg", userId: user2Id, groupId, recordedAt: generateDate(4) },
            { type: "weight", value: "175", unit: "lbs", userId: user2Id, groupId, recordedAt: generateDate(4) }
        ];
        await Vital.insertMany(vitals);
        console.log(`Inserted ${vitals.length} MORE Vitals for user2`);

        // 5. Seed MORE Medications for user2
        const medications = [
            { name: "Metoprolol", dosage: "25 mg", frequency: "daily", groupId, recipientId: user2Id, instructions: "Take once daily with meals" },
            { name: "Lisinopril", dosage: "10 mg", frequency: "daily", groupId, recipientId: user2Id, instructions: "Take once daily in the morning" },
            { name: "Atorvastatin", dosage: "40 mg", frequency: "daily", groupId, recipientId: user2Id, instructions: "Take at bedtime" },
            { name: "Metformin", dosage: "500 mg", frequency: "daily", timesPerDay: 2, groupId, recipientId: user2Id, instructions: "Take with morning and evening meals" },
            { name: "Aspirin", dosage: "81 mg", frequency: "daily", groupId, recipientId: user2Id, instructions: "Take once daily" },
            { name: "Vitamin D3", dosage: "2000 units", frequency: "daily", groupId, recipientId: user2Id, instructions: "Take in the morning" }
        ];
        await Medication.insertMany(medications);
        console.log(`Inserted ${medications.length} MORE Medications for user2`);

        // 6. Seed MORE Tasks for user2
        const tasks = [
            { groupId, recipientId: user2Id, createdBy: user1Id, title: "Doctor Appointment", description: "Follow up visit with Dr. Smith", type: "event", status: "pending", dueAt: generateDate(-2) },
            { groupId, recipientId: user2Id, createdBy: user3Id, title: "Buy Groceries", description: "Get fresh vegetables, low sodium options", type: "task", status: "pending", repeatRule: "weekly", dueAt: generateDate(-1) },
            { groupId, recipientId: user2Id, createdBy: user1Id, title: "Blood Work Lab", description: "Fasting required for 12 hours prior", type: "task", status: "pending", dueAt: generateDate(-5) },
            { groupId, recipientId: user2Id, createdBy: user3Id, title: "Pick up Prescription", description: "Pharmacy closes at 8 PM", type: "task", status: "completed", dueAt: generateDate(2) },
            { groupId, recipientId: user2Id, createdBy: user1Id, title: "Call Insurance", description: "Clarify coverage for upcoming tests", type: "task", status: "pending", dueAt: generateDate(-3) },
            { groupId, recipientId: user2Id, createdBy: user3Id, title: "Evening Walk", description: "30-minute light walk as per cardio plan", type: "task", status: "pending", repeatRule: "daily", dueAt: generateDate(0) }
        ];
        await Task.insertMany(tasks);
        console.log(`Inserted ${tasks.length} MORE Tasks for user2`);

        // 7. Seed Chat Messages
        const messages = [
            { groupId, senderId: user1Id, message: "Hello everyone, I've created this group to coordinate care.", createdAt: generateDate(4) },
            { groupId, senderId: user2Id, message: "Thanks for setting this up!", createdAt: generateDate(4) },
            { groupId, senderId: user3Id, message: "I'll be stopping by on Tuesday to help with groceries.", createdAt: generateDate(3) },
            { groupId, senderId: user2Id, message: "Sounds good, I need some fresh vegetables.", createdAt: generateDate(3) },
            { groupId, senderId: user1Id, message: "Don't forget the doctor appointment this week.", createdAt: generateDate(1) },
            { groupId, senderId: user2Id, message: "I have it on my calendar.", createdAt: generateDate(1) },
            { groupId, senderId: user3Id, message: "I can drive you to the appointment if you need.", createdAt: generateDate(0) }
        ];
        await Chat.insertMany(messages);
        console.log(`Inserted ${messages.length} MORE Chat Messages`);

        console.log("Successfully seeded ALL additional dummy data!");
    } catch (err) {
        console.error("Error seeding data:", err);
    } finally {
        mongoose.disconnect();
    }
};

seedData();
