import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';
import {isValidArray,isValidEmail,isValidID,isValidPassword,isValidString,isValidNumber } from '../utils/validation.utils.js';
//redisClient
import { createClient } from 'redis';

const client = createClient();

//Data Functions

//Create User
export const createUser = async ( firstName,
  lastName,
  email,
  password,
  confirmPassword
) => {
    
};
//now create only function defination we will implement later

//Get User by ID
export const getUserById = async (userId) => {};

//Update User
export const updateUser = async (userId, updateData) => {};

//Delete User
export const deleteUser = async (userId) => {}; 

//Get All Users
export const getAllUsers = async () => {};

//Authenticate User
export const authenticateUser = async (email, password) => {};

//Change User Password
export const changeUserPassword = async (userId, oldPassword, newPassword) => {};

//Reset User Password
export const resetUserPassword = async (email, newPassword) => {};

//Verify User Email
export const verifyUserEmail = async (userId, verificationCode) => {};

//Send Password Reset Email
export const sendPasswordResetEmail = async (email) => {};

//Update User Profile Picture
export const updateUserProfilePicture = async (userId, profilePictureUrl) => {};

//Add User Role
export const addUserRole = async (userId, role) => {};

//Remove User Role
export const removeUserRole = async (userId, role) => {};

//Get Users by Role
export const getUsersByRole = async (role) => {};

//Search Users
export const searchUsers = async (searchTerm) => {};


