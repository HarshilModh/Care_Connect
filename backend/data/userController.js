import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import {
  isValidArray,
  isValidEmail,
  isValidID,
  isValidPassword,
  isValidString,
  isValidNumber,
  isValidPhone,
} from "../utils/validation.utils.js";
//redisClient
import { createClient } from "redis";
import { toSeconds } from "../helper.js";
import jwt from "jsonwebtoken";
import { Membership } from "../models/memberShip.model.js";
import { FamilyGroup } from "../models/familyGroups.model.js";
import { Chat } from "../models/chat.model.js";
import { sendMail } from "../integrations/nodemailer.js";
import admin from "../integrations/firebaseAdmin.js";
import { Task } from "../models/task.model.js";
import { createNotification } from "./notificationController.js";
import { Notification } from "../models/notification.model.js";
import { Medication } from "../models/medication.model.js";
import { Vital } from "../models/vital.model.js";
import { Document } from "../models/document.model.js";

dotenv.config();

const client = createClient({
  url: process.env.REDIS_URL,
});
client.on("error", (err) => {
  console.error("Redis Client Error:", err);
});
if (!client.isOpen) {
  await client.connect();
}

//Data Functions
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    console.log(userId);
    const user = await User.findById(userId);
    console.log(user);
    if (!user) {
      throw new Error("User not found when generating tokens");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    const refreshTTL = toSeconds(process.env.REFRESH_TOKEN_EXPIRY || "7d");
    console.log(refreshTTL);
    await client.set(`refresh:${userId}`, refreshToken, { EX: refreshTTL });

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    console.log("Generated tokens for user:", accessToken, refreshToken);

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error(`Failed to generate tokens: ${error.message}`);
  }
};
//Create User
export const createUser = async (
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
  needPasswordReset,
  uid
) => {
  try {
    //validation
    console.log("Creating user with data:", {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      needPasswordReset,
      uid,
    });

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      throw new Error("All fields are required");
    }
    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      throw new Error("All fields must be strings");
    }
    if (
      firstName.trim() === "" ||
      lastName.trim() === "" ||
      email.trim() === "" ||
      password.trim() === "" ||
      confirmPassword.trim() === ""
    ) {
      throw new Error("Fields cannot be empty");
    }

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const normEmail = email.trim().toLowerCase();
    //check if user already exists
    const existingUser = await User.findOne({ email: normEmail });
    console.log("existingUser", existingUser);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    console.log("needPasswordReset value", needPasswordReset);

    let resetPasswordLink = null;

    if (needPasswordReset === true) {
      const actionCodeSettings = {
        url: `${process.env.CLIENT_URL}`, // or your frontend route
        handleCodeInApp: true,
      };
      console.log("actionCodeSettings", actionCodeSettings);

      const resetPasswordLink = await admin
        .auth()
        .generatePasswordResetLink(normEmail, actionCodeSettings);

      console.log("resetPasswordLink", resetPasswordLink);

      // Now send email with this link instead of plain password
      const response = await sendMail({
        to: normEmail,
        subject: "Welcome to Care Connect – Set Your Password",
        text: `Hello ${firstName},

Your Care Connect account has been created.

Please set your password using the secure link below:
${resetPasswordLink}

If you did not request this, you can ignore this email.

Best regards,
Care Connect Team`,
        html: `
          <p>Hello ${firstName},</p>
          <p>Your Care Connect account has been successfully created.</p>
          <p>Please set your password using the secure link below:</p>
          <p>
            <a href="${resetPasswordLink}" target="_blank" rel="noopener noreferrer">
              Click here to set your password
            </a>
          </p>
          <p>If the button doesn't work, copy and paste this URL in your browser:</p>
          <p>${resetPasswordLink}</p>
          <p>Best regards,<br/>Care Connect Team</p>
        `,
      });

      console.log("Account creation email sent, message ID:", response);
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    //create new user
    const newUser = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: `${firstName.trim()} ${lastName.trim()}`,
      email: normEmail,
      password: password.trim(),
      needPasswordReset: needPasswordReset || false,
      uid: uid || null,
    });

    console.log("New user created:", newUser);

    // Create welcome notification
    try {
      await createNotification({
        type: "system",
        recipientId: newUser._id.toString(),
        title: "Welcome to CareConnect!",
        message: `Hi ${firstName}, welcome to CareConnect!`,
        metadata: {},
      });
    } catch (notifErr) {
      console.error("Failed to create welcome notification:", notifErr);
    }

    const { password: _ignore, ...safe } = newUser.toObject();
    return safe;
  } catch (error) {
    console.error("Error in createUser:", error);
    if (error?.code === 11000 && error?.keyPattern?.email) {
      console.log("Duplicate email error caught");
      throw new Error("User with this email already exists");
    }
    throw new Error(`Error creating user: ${error.message}`);
  }
};
//demo sample data for user creation

//now create only function defination we will implement later

//Get User by ID
export const getUserById = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user id");
    }

    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) throw new Error("User not found");

    return user;
  } catch (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
};

//Update User
export const updateUser = async (userId, updateData) => {
  try {
    console.log(userId);
    console.log(updateData);
    let firebaseUid = updateData.firebaseUid || null;

    if (!firebaseUid) {
      throw new Error("Firebase UID is required");
    }
    if (!isValidID(userId, "userId")) throw new Error("Invalid user id");
    if (!updateData || typeof updateData !== "object") {
      throw new Error("No update data provided");
    }

    const { firstName, lastName, email } = updateData;
    const safe = {};

    if (typeof firstName === "string" && firstName.trim()) {
      safe.firstName = firstName.trim();
    }
    if (typeof lastName === "string" && lastName.trim()) {
      safe.lastName = lastName.trim();
    }

    if (Object.keys(safe).length === 0) {
      throw new Error("No valid fields to update");
    }
    //also set isVerified to false if email is changed
    if (typeof email === "string" && email.trim()) {
      const normEmail = email.trim().toLowerCase();
      if (!isValidEmail(normEmail)) throw new Error("Invalid email");
      safe.email = normEmail;
      safe.isVerified = false;
    }
    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: safe },
      { new: true, runValidators: true }
    ).select("-password -refreshToken");
    //also need to update in firebase
    if (firebaseUid) {
      await admin.auth().updateUser(firebaseUid, {
        email: safe.email,
        displayName: `${safe.firstName || updated.firstName} ${
          safe.lastName || updated.lastName
        }`,
      });
    }

    if (!updated) throw new Error("User not found");
    return updated;
  } catch (error) {
    console.log(error);
    throw new Error(`Error updating user: ${error.message}`);
  }
};

//Delete User
export const deleteUser = async (userId) => {
  try {
    console.log("🗑️ Starting user deletion for:", userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user id");
    }

    // 1) Load user
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // 2) Delete all chat messages sent by this user (from ALL groups)
    const userChatsResult = await Chat.deleteMany({ senderId: userId });
    console.log(
      `Deleted ${userChatsResult.deletedCount} chat messages sent by user`
    );

    // 3) Delete all memberships where this user is a member (but not owner)
    const membershipResult = await Membership.deleteMany({
      userId,
      role: { $ne: "admin" }, // Don't delete admin memberships yet
    });
    console.log(
      `Deleted ${membershipResult.deletedCount} non-admin memberships for user`
    );

    // 4) Handle groups owned by this user - transfer ownership or delete
    const ownedGroups = await FamilyGroup.find({ createdBy: userId });

    let groupsTransferred = 0;
    let groupsDeleted = 0;
    let groupMembershipDeleteResult = { deletedCount: 0 };
    let ownedGroupChatsResult = { deletedCount: 0 };

    for (const group of ownedGroups) {
      // Find next admin or family member to transfer ownership
      const newOwnerMembership = await Membership.findOne({
        groupId: group._id,
        userId: { $ne: userId },
        status: "active",
        role: { $in: ["admin", "familyMember"] },
      }).sort({ role: 1, createdAt: 1 }); // Prefer admin, then oldest member

      if (newOwnerMembership) {
        // Transfer ownership
        group.createdBy = newOwnerMembership.userId;

        // Promote new owner to admin if not already
        if (newOwnerMembership.role !== "admin") {
          newOwnerMembership.role = "admin";
          await newOwnerMembership.save();
        }

        await group.save();
        groupsTransferred++;
        console.log(
          `Transferred ownership of group ${group._id} to user ${newOwnerMembership.userId}`
        );

        // Create notification for new owner
        try {
          await createNotification({
            type: "group",
            recipientId: newOwnerMembership.userId.toString(),
            title: "Group Ownership Transferred",
            message: `You are now the owner of "${group.groupName}"`,
            metadata: { groupId: group._id.toString() },
          });
        } catch (notifErr) {
          console.error("Failed to create transfer notification:", notifErr);
        }
      } else {
        // No members left - delete the group and all related data
        await Chat.deleteMany({ groupId: group._id });
        await Membership.deleteMany({ groupId: group._id });
        await group.deleteOne();
        groupsDeleted++;
        console.log(
          `Deleted empty group ${group._id} (no members to transfer to)`
        );
      }
    }

    // 5) Now delete remaining admin memberships for this user
    const adminMembershipResult = await Membership.deleteMany({
      userId,
      role: "admin",
    });
    console.log(
      `Deleted ${adminMembershipResult.deletedCount} admin memberships for user`
    );
    //delete all the tasks created by this user, createdBy,recipientId,assignedTo fields, createdBy fields
    const tasksResult = await Task.deleteMany({
      $or: [
        { createdBy: userId },
        { recipientId: userId },
        { assignedTo: userId },
      ],
    });
    console.log(`Deleted ${tasksResult.deletedCount} tasks related to user`);
    //delete all notifications for this user recipientId and senderId
    const notificationsResult = await Notification.deleteMany({
      $or: [{ recipientId: userId }, { senderId: userId }],
    });
    //deleed all notifications for this user recipientId and senderId fields
    console.log(
      `Deleted ${notificationsResult.deletedCount} notifications for user`
    );

    // Delete medications for this user (recipientId)
    const medicationResult = await Medication.deleteMany({
      recipientId: userId,
    });
    console.log(
      `Deleted ${medicationResult.deletedCount} medications for user`
    );

    // Delete vitals for this user (userId)
    const vitalResult = await Vital.deleteMany({ userId });
    console.log(`Deleted ${vitalResult.deletedCount} vitals for user`);

    //commenting out documents deletion as it is not needed
    // Delete documents uploaded by this user (uploadedBy)
    // const documentResult = await Document.deleteMany({ uploadedBy: userId });
    // console.log(`Deleted ${documentResult.deletedCount} documents uploaded by user`);

    // 6) Delete the user from MongoDB
    await User.findByIdAndDelete(userId);
    console.log(`Deleted user from MongoDB: ${userId}`);
    // 7) Clear refresh token from Redis
    try {
      const redisKey = `refresh:${userId}`;
      await client.del(redisKey);
      console.log(`Deleted Redis refresh token for user: ${userId}`);
    } catch (redisErr) {
      console.error(
        "Failed to clear Redis token:",
        redisErr?.message || redisErr
      );
    }

    // 8) Best-effort: delete Firebase user
    try {
      const firebaseUid = user.uid || null;
      if (firebaseUid) {
        await admin.auth().deleteUser(firebaseUid);
        console.log(`Deleted Firebase user: ${firebaseUid}`);
      } else {
        console.log("No Firebase UID found; skipping Firebase deletion");
      }
    } catch (fbErr) {
      console.error("Failed to delete Firebase user:", fbErr?.message || fbErr);
    }

    const result = {
      ok: true,
      deletedUserId: userId,
      removedUserChats: userChatsResult.deletedCount || 0,
      removedMemberships:
        membershipResult.deletedCount + adminMembershipResult.deletedCount || 0,
      groupsTransferred: groupsTransferred,
      groupsDeleted: groupsDeleted,
      removedMedications: medicationResult.deletedCount || 0,
      removedVitals: vitalResult.deletedCount || 0,
      // removedDocuments: documentResult.deletedCount || 0
    };

    console.log("User deletion completed successfully:", result);
    return result;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error(`Error deleting user: ${error.message}`);
  }
};

//Get All Users
export const getAllUsers = async () => {
  try {
    const users = await User.find({}).select("-password");
    return users;
  } catch (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }
};

//Authenticate User
export const authenticateUser = async (email, password) => {
  try {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }
    if (typeof email !== "string" || typeof password !== "string") {
      throw new Error("Email and password must be strings");
    }
    if (email.trim() === "" || password.trim() === "") {
      throw new Error("Email and password cannot be empty");
    }
    // if (!isValidEmail(email) || !isValidPassword(password)) {
    //   throw new Error("Invalid email or password format");
    // }
    // console.log(password);

    email = email.trim().toLowerCase();
    password = password.trim();

    const user = await User.findOne({ email });
    console.log("user", user);

    if (!user) {
      throw new Error("User not found with this Email, please sign up");
    }

    if (user.isVerified === false) {
      throw new Error(
        "Email not verified. Please verify your email before logging in."
      );
    }

    console.log(user.password);
    // const hashedPassword = await encry.hash(user.password.trim(), 10);
    // console.log("hashedPassword", hashedPassword);

    const isPasswordValid = await user.isPasswordCorrect(password);
    console.log("isPasswordValid:", isPasswordValid);
    if (!isPasswordValid) {
      throw new Error("Invalid password or email");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );
    let loggedInUser = await User.findOne({ email }).select(
      "-password -refreshToken"
    );

    return { user: loggedInUser, tokens: { accessToken, refreshToken } };
  } catch (error) {
    throw new Error(error.message);
  }
};

//Change User Password
export const changeUserPassword = async (userId, newPassword) => {
  try {
    if (!isValidID(userId, "userId")) throw new Error("Invalid user id");
    if (!newPassword) throw new Error(" password is required");
    if (typeof newPassword !== "string")
      throw new Error("Passwords must be strings");

    const newP = newPassword.trim();

    if (!isValidPassword(newP))
      throw new Error("Password does not meet policy");
    // if (oldP === newP) throw new Error('New password must be different');

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (user.needPasswordReset === true) {
      user.needPasswordReset = false;
      const response = await Membership.updateOne(
        { userId: userId },
        { $set: { needPasswordReset: false } }
      );
      console.log("Updated membership needPasswordReset:", response);
    }

    user.password = newP;
    await user.save();

    await client.del(`refresh:${userId}`);

    return { ok: true };
  } catch (error) {
    throw new Error(`Error changing password: ${error.message}`);
  }
};

//Reset User Password
export const resetUserPassword = async (email, newPassword) => {
  try {
    if (!email || typeof email !== "string")
      throw new Error("Email is required");
    if (!newPassword || typeof newPassword !== "string")
      throw new Error("New password is required");

    const normEmail = email.trim().toLowerCase();
    // if (!isValidEmail(normEmail) || !isValidPassword(newPassword.trim())) {
    //   throw new Error("Invalid email or password format");
    // }

    const user = await User.findOne({ email: normEmail });
    if (!user) throw new Error("User not found");

    if (user.isVerified === false) {
      user.isVerified = true;
      console.log("isVerified changes to true", user.isVerified);
    }

    // Clear reset flag correctly
    if (user.needPasswordReset === true) {
      user.needPasswordReset = false;
      console.log("needPasswordReset changes to false", user.needPasswordReset);
    }

    user.password = newPassword.trim();
    await user.save();

    await client.del(`refresh:${user._id}`); // force re-login

    console.log("user password reset successfull");

    return { ok: true };
  } catch (error) {
    console.log(error);
    throw new Error(`Error resetting password: ${error.message}`);
  }
};

//Verify User Email
export const verifyUserEmail = async (userId, verificationCode) => {};

//Send Password Reset Email
export const sendPasswordResetEmail = async (email) => {};

//Update User Profile Picture
export const updateUserProfilePicture = async (userId, profilePictureUrl) => {
  try {
    if (!isValidID(userId, "userId")) throw new Error("Invalid user id");
    if (typeof profilePictureUrl !== "string" || !profilePictureUrl.trim())
      throw new Error("Invalid profile picture URL");

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { profilePicture: profilePictureUrl.trim() } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) throw new Error("User not found");
    return updated;
  } catch (error) {
    throw new Error(`Error updating profile picture: ${error.message}`);
  }
};

//Add User Role
export const addUserRole = async (userId, role) => {
  try {
    if (!isValidID(userId, "userId")) throw new Error("Invalid user id");
    if (typeof role !== "string") throw new Error("Role required");

    const r = role.trim().toLowerCase();
    const map = {
      admin: "admin",
      familymember: "familyMember",
      caregiver: "careGiver",
      carerecipient: "careRecipient",
    };
    const normalized = map[r];
    if (!normalized) throw new Error("Invalid role");
    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { role: normalized } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) throw new Error("User not found");
    return updated;
  } catch (error) {
    throw new Error(`Error adding role: ${error.message}`);
  }
};

//Remove User Role
export const removeUserRole = async (userId, role) => {
  try {
    if (!isValidID(userId, "userId")) throw new Error("Invalid user id");

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { role: "familyMember" } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) throw new Error("User not found");
    return updated;
  } catch (error) {
    throw new Error(`Error removing role: ${error.message}`);
  }
};

//Get Users by Role
export const getUsersByRole = async (role) => {
  try {
    if (typeof role !== "string") throw new Error("Role required");
    const r = role.trim().toLowerCase();
    if (!r) throw new Error("Role cannot be empty");
    const map = {
      admin: "admin",
      familymember: "familyMember",
      caregiver: "careGiver",
      carerecipient: "careRecipient",
    };
    const normalized = map[r];
    if (!normalized) throw new Error("Invalid role");
    const users = await User.find({ role: normalized }).select("-password");
    return users;
  } catch (error) {
    throw new Error(`Error fetching users by role: ${error.message}`);
  }
};

//Search Users
export const searchUsers = async (searchTerm) => {
  try {
    if (typeof searchTerm !== "string") throw new Error("Search term required");
    const q = searchTerm.trim();
    if (!q) throw new Error("Search term cannot be empty");

    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const users = await User.find({
      $or: [{ firstName: rx }, { lastName: rx }, { email: rx }, { phone: rx }],
    }).select("-password");

    return users;
  } catch (error) {
    throw new Error(`Error searching users: ${error.message}`);
  }
};

export const logoutUser = async (userId) => {
  try {
    if (!isValidID(userId, "userId")) throw new Error("Invalid user id");
    await client.del(`refresh:${userId}`);
    await User.findByIdAndUpdate(userId, { $set: { refreshToken: null } });
    return { ok: true };
  } catch (error) {
    throw new Error(`Error logging out: ${error.message}`);
  }
};

export const refreshToken = async (oldRefreshToken) => {
  try {
    if (!oldRefreshToken || typeof oldRefreshToken !== "string") {
      throw new Error("Refresh token required");
    }
    let payload;
    try {
      payload = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (e) {
      throw new Error("Invalid or expired refresh token");
    }
    const userId = payload?._id;
    if (!isValidID(userId, "userId")) throw new Error("Invalid token payload");

    const stored = await client.get(`refresh:${userId}`);
    if (!stored || stored !== oldRefreshToken) {
      throw new Error("Refresh token not recognized");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefereshTokens(userId);

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    throw new Error(`Error refreshing token: ${error.message}`);
  }
};

export const authenticateUserWithGoogle = async (idToken) => {
  try {
    if (!idToken || typeof idToken !== "string") {
      throw new Error("Firebase ID token required");
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("Decoded Firebase token<<>>", decodedToken);

    if (!decodedToken || !decodedToken.uid) {
      throw new Error("Invalid Firebase ID token");
    }

    const checkUser = await User.findOne({ uid: decodedToken.uid });
    if (checkUser) {
      const { accessToken, refreshToken } =
        await generateAccessAndRefereshTokens(checkUser._id);

      const loggedInUser = await User.findById(checkUser._id).select(
        "-password -refreshToken"
      );

      return { user: loggedInUser, tokens: { accessToken, refreshToken } };
    }

    const { uid, email, name, picture } = decodedToken;
    const normEmail = email.trim().toLowerCase();
    const [firstName, lastName = ""] = (name || "Google User").split(" ");
    // Password must contain at least one uppercase letter, one lowercase letter, and one number.
    const password = Math.random().toString(36).slice(-8) + "Aa1"; // random  password

    // Add user in  MongoDB
    let user = await User.findOne({ uid: uid });
    let userExistsWithEmail = await User.findOne({ email: normEmail });
    // If user exists with the same email but not with Google, link Google UID
    if (!user && userExistsWithEmail) {
      // Link Google UID to existing user
      userExistsWithEmail.uid = uid;
      userExistsWithEmail.googleId = uid;
      userExistsWithEmail.isVerified = true;
      userExistsWithEmail.profileImage = picture || "";
      await userExistsWithEmail.save({ validateBeforeSave: false });
      user = userExistsWithEmail;
    }

    if (!user) {
      user = await User.create({
        uid: uid,
        firstName,
        lastName,
        displayName: firstName, //
        email: normEmail,
        isVerified: true,
        googleId: uid,
        password,
        profileImage: picture || "",
      });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    try {
      await createNotification({
        type: "system",
        recipientId: user._id.toString(),
        title: "Welcome to CareConnect!",
        message: `Hi ${firstName}, welcome to CareConnect!`,
        metadata: {},
      });
    } catch (notificationError) {
      console.error("Error creating welcome notification:", notificationError);
    }
    return { user: loggedInUser, tokens: { accessToken, refreshToken } };
  } catch (error) {
    console.error("Error authenticating with Firebase Google:", error);
    throw new Error(`Error verifying Firebase ID token: ${error.message}`);
  }
};
export const searchUsersByEmail = async (email) => {
  try {
    if (typeof email !== "string") {
      throw new Error("Email required");
    }
    if (!email.trim().length > 0) {
      throw new Error("Email cannot be empty");
    }
    let cleanedEmail = email.trim().toLowerCase();
    // if (!isValidEmail(cleanedEmail)){
    //   throw new Error('Invalid email format');
    // }
    const users = await User.find({
      email: { $regex: cleanedEmail, $options: "i" },
    }).select("-password -refreshToken");
    return users;
  } catch (error) {
    throw new Error(`Error searching users by email: ${error.message}`);
  }
};
