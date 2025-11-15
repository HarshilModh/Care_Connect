import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';
import { isValidArray, isValidEmail, isValidID, isValidPassword, isValidString, isValidNumber, isValidPhone } from '../utils/validation.utils.js';
//redisClient
import { createClient } from 'redis';
import { toSeconds } from '../helper.js'
import jwt from 'jsonwebtoken';

import admin from "../integrations/firebaseAdmin.js";

dotenv.config();

const client = createClient({
  url: process.env.REDIS_URL,
});
client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});
if (!client.isOpen) {
  await client.connect();
}

//Data Functions
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found when generating tokens');
    }
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    const refreshTTL = toSeconds(process.env.REFRESH_TOKEN_EXPIRY || '7d');
    await client.set(`refresh:${userId}`, refreshToken, { EX: refreshTTL });

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }


  } catch (error) {
    throw new Error(`Failed to generate tokens: ${error.message}`)
  }
}
//Create User
export const createUser = async (
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
  phone,
  uid
) => {
  try {
    //validation
    if (!firstName || !lastName || !email || !password || !confirmPassword || !phone) {
      throw new Error('All fields are required');
    }
    if (typeof firstName !== 'string' || typeof lastName !== 'string' || typeof email !== 'string' || typeof password !== 'string' || typeof confirmPassword !== 'string') {
      throw new Error('All fields must be strings');
    }
    if (firstName.trim() === "" || lastName.trim() === "" || email.trim() === "" || password.trim() === "" || confirmPassword.trim() === "") {
      throw new Error('Fields cannot be empty');
    }
    if (
      !isValidString(firstName, "firstName") ||
      !isValidString(lastName, "lastName") ||
      !isValidEmail(email) ||
      !isValidPassword(password) ||
      !isValidPassword(confirmPassword)
    ) {
      throw new Error('Invalid input data');
    }
    // if (phone) {
    //   if (!isValidPhone(phone)) {
    //     throw new Error('Invalid phone number');
    //   }
    // }
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const normEmail = email.trim().toLowerCase()
    //check if user already exists
    const existingUser = await User.findOne({ email: normEmail });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    //create new user
    const newUser = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: firstName,// 
      email: normEmail,
      password: password.trim(),
      uid: uid || null,
    });

    const { password: _ignore, ...safe } = newUser.toObject();
    return safe;
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.email) {
      throw new Error('User with this email already exists');
    }
    throw new Error(`Error creating user: ${error.message}`);
  }

};
//demo sample data for user creation

//now create only function defination we will implement later

//Get User by ID
export const getUserById = async (userId) => {
  try {
    if (!isValidID(userId, 'userId')) throw new Error('Invalid user id');

    const user = await User.findById(userId).select('-password -refreshToken');
    if (!user) throw new Error('User not found');

    return user
  } catch (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
};

//Update User
export const updateUser = async (userId, updateData) => {
  try {
    if (!isValidID(userId, 'userId')) throw new Error('Invalid user id');
    if (!updateData || typeof updateData !== 'object') {
      throw new Error('No update data provided');
    }

    const { firstName, lastName, phone, profilePicture } = updateData;
    const safe = {}

    if (typeof firstName === 'string' && firstName.trim()) {
      safe.firstName = isValidString(firstName, 'firstName');
    }
    if (typeof lastName === 'string' && lastName.trim()) {
      safe.lastName = isValidString(lastName, 'lastName');
    }
    if (typeof profilePicture === 'string' && profilePicture.trim()) safe.profilePicture = profilePicture.trim();
    if (typeof phone === 'string' && phone.trim()) {
      if (!isValidPhone(phone)) throw new Error('Invalid phone');
      safe.phone = phone.trim();
    }


    if (Object.keys(safe).length === 0) {
      throw new Error('No valid fields to update');
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: safe },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) throw new Error('User not found');
    return updated;

  } catch (error) {
    throw new Error(`Error updating user: ${error.message}`);
  }
};

//Delete User
export const deleteUser = async (userId) => {
  try {
    if (!isValidID(userId, 'userId')) throw new Error('Invalid user id');

    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) throw new Error('User not found');

    await client.del(`refresh:${userId}`);
    return { ok: true };
  } catch (error) {
    throw new Error(`Error deleting user: ${error.message}`);
  }
};

//Get All Users
export const getAllUsers = async () => {
  try {
    const users = await User.find({}).select('-password');
    return users;
  } catch (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }
};

//Authenticate User
export const authenticateUser = async (email, password) => {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new Error('Email and password must be strings');
    }
    if (email.trim() === "" || password.trim() === "") {
      throw new Error('Email and password cannot be empty');
    }
    if (!isValidEmail(email) || !isValidPassword(password)) {
      throw new Error('Invalid email or password format');
    }
    //console.log(password);

    email = email.trim().toLowerCase();
    password = password.trim();

    const user = await User.findOne({ email });
    console.log("user", user);

    if (user.isVerified === false) {
      throw new Error('Email not verified. Please verify your email before logging in.');
    };
    if (!user) {
      throw new Error('User not found');
    }
    // console.log(user.password);

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);
    let loggedInUser = await User.findOne({ email }).select('-password -refreshToken');

    return { user: loggedInUser, tokens: { accessToken, refreshToken } };
  } catch (error) {
    throw new Error(error.message);
  }
};

//Change User Password
export const changeUserPassword = async (userId, newPassword) => {
  try {
    if (!isValidID(userId, 'userId')) throw new Error('Invalid user id');
    if (!newPassword) throw new Error(' password is required');
    if (typeof newPassword !== 'string')
      throw new Error('Passwords must be strings');

    const newP = newPassword.trim();

    if (!isValidPassword(newP))
      throw new Error('Password does not meet policy');
    // if (oldP === newP) throw new Error('New password must be different');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

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
    if (!email || typeof email !== 'string') throw new Error('Email is required');
    if (!newPassword || typeof newPassword !== 'string') throw new Error('New password is required');

    const normEmail = email.trim().toLowerCase();
    if (!isValidEmail(normEmail) || !isValidPassword(newPassword.trim())) {
      throw new Error('Invalid email or password format');
    }

    const user = await User.findOne({ email: normEmail });
    if (!user) throw new Error('User not found');

    user.password = newPassword.trim();
    await user.save();

    await client.del(`refresh:${user._id}`); // force re-login

    return { ok: true };

  } catch (error) {
    throw new Error(`Error resetting password: ${error.message}`);
  }
};

//Verify User Email
export const verifyUserEmail = async (userId, verificationCode) => { };

//Send Password Reset Email
export const sendPasswordResetEmail = async (email) => { };

//Update User Profile Picture
export const updateUserProfilePicture = async (userId, profilePictureUrl) => {
  try {
    if (!isValidID(userId, 'userId')) throw new Error('Invalid user id');
    if (typeof profilePictureUrl !== 'string' || !profilePictureUrl.trim())
      throw new Error('Invalid profile picture URL');

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { profilePicture: profilePictureUrl.trim() } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) throw new Error('User not found');
    return updated;
  } catch (error) {
    throw new Error(`Error updating profile picture: ${error.message}`);
  }
};

//Add User Role
export const addUserRole = async (userId, role) => {
  try {
    if (!isValidID(userId, 'userId')) throw new Error('Invalid user id');
    if (typeof role !== 'string') throw new Error('Role required');

    const r = role.trim().toLowerCase();
    const map = {
      admin: 'admin',
      familymember: 'familyMember',
      caregiver: 'careGiver',
      carerecipient: 'careRecipient',
    };
    const normalized = map[r];
    if (!normalized) throw new Error('Invalid role');
    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { role: normalized } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) throw new Error('User not found');
    return updated;
  } catch (error) {
    throw new Error(`Error adding role: ${error.message}`);
  }
};

//Remove User Role
export const removeUserRole = async (userId, role) => {
  try {
    if (!isValidID(userId, 'userId')) throw new Error('Invalid user id');

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { role: 'familyMember' } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) throw new Error('User not found');
    return updated;
  } catch (error) {
    throw new Error(`Error removing role: ${error.message}`);
  }
};

//Get Users by Role
export const getUsersByRole = async (role) => {
  try {
    if (typeof role !== 'string') throw new Error('Role required');
    const r = role.trim().toLowerCase();
    if (!r) throw new Error('Role cannot be empty');
    const map = {
      admin: 'admin',
      familymember: 'familyMember',
      caregiver: 'careGiver',
      carerecipient: 'careRecipient',
    };
    const normalized = map[r];
    if (!normalized) throw new Error('Invalid role');
    const users = await User.find({ role: normalized }).select('-password');
    return users;
  } catch (error) {
    throw new Error(`Error fetching users by role: ${error.message}`);
  }
};

//Search Users
export const searchUsers = async (searchTerm) => {
  try {
    if (typeof searchTerm !== 'string') throw new Error('Search term required');
    const q = searchTerm.trim();
    if (!q) throw new Error('Search term cannot be empty');

    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({
      $or: [{ firstName: rx }, { lastName: rx }, { email: rx }, { phone: rx }],
    }).select('-password');

    return users;
  } catch (error) {
    throw new Error(`Error searching users: ${error.message}`);
  }
};

export const logoutUser = async (userId) => {
  try {
    if (!isValidID(userId, 'userId')) throw new Error('Invalid user id');
    await client.del(`refresh:${userId}`);
    await User.findByIdAndUpdate(userId, { $set: { refreshToken: null } });
    return { ok: true };
  } catch (error) {
    throw new Error(`Error logging out: ${error.message}`);
  }
}

export const refreshToken = async (oldRefreshToken) => {
  try {
    if (!oldRefreshToken || typeof oldRefreshToken !== 'string') {
      throw new Error('Refresh token required');
    }
    let payload;
    try {
      payload = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (e) {
      throw new Error('Invalid or expired refresh token');
    }
    const userId = payload?._id;
    if (!isValidID(userId, 'userId')) throw new Error('Invalid token payload');

    const stored = await client.get(`refresh:${userId}`);
    if (!stored || stored !== oldRefreshToken) {
      throw new Error('Refresh token not recognized');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefereshTokens(userId);

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    throw new Error(`Error refreshing token: ${error.message}`);
  }
}

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

      const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(checkUser._id);

      const loggedInUser = await User.findById(checkUser._id).select("-password -refreshToken");

      return { user: loggedInUser, tokens: { accessToken, refreshToken } };
    }

    const { uid, email, name, picture } = decodedToken;
    const [firstName, lastName = ""] = (name || "Google User").split(" ");
    // Password must contain at least one uppercase letter, one lowercase letter, and one number.
    const password = Math.random().toString(36).slice(-8) + "Aa1"; // random  password

    // Add user in  MongoDB
    let user = await User.findOne({ uid: uid });
    let userExistsWithEmail = await User.findOne({ email: email });
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
        displayName: firstName,// 
        email,
        isVerified: true,
        googleId: uid,
        password,
        profileImage: picture || "",
      });
    }


    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);


    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return { user: loggedInUser, tokens: { accessToken, refreshToken } };
  } catch (error) {
    console.error("Error authenticating with Firebase Google:", error);
    throw new Error(`Error verifying Firebase ID token: ${error.message}`);
  }
}
export const searchUsersByEmail = async (email) => {
  try {
    if (typeof email !== 'string'){
      throw new Error('Email required');
    }
    if (!email.trim().length>0){
      throw new Error('Email cannot be empty');
    }
    let cleanedEmail = email.trim().toLowerCase();
    // if (!isValidEmail(cleanedEmail)){
    //   throw new Error('Invalid email format');
    // }
    const users = await User.find({ email: { $regex: cleanedEmail, $options: 'i' } }).select('-password -refreshToken');
    return users;
  } catch (error) {
    throw new Error(`Error searching users by email: ${error.message}`);
  }
};