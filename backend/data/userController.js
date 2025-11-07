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
const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}
//Create User
export const createUser = async ( firstName,
  lastName,
  email,
  password,
  confirmPassword
) => {
  try {
    //validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      throw new Error('All fields are required');
    }
    if(typeof firstName !== 'string' || typeof lastName !== 'string' || typeof email !== 'string' || typeof password !== 'string' || typeof confirmPassword !== 'string'){
      throw new Error('All fields must be strings');
    }
    if(firstName.trim()==="" || lastName.trim()==="" || email.trim()==="" || password.trim()==="" || confirmPassword.trim()===""){
      throw new Error('Fields cannot be empty');
    }
    if (
      !isValidString(firstName) ||
      !isValidString(lastName) ||
      !isValidEmail(email) ||
      !isValidPassword(password) ||
      !isValidPassword(confirmPassword)
    ) {
      throw new Error('Invalid input data');
    }
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    //check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    } 
    //create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
    });
    await newUser.save();
    return newUser;
  } catch (error) {
    throw new Error(`Error creating user: ${error.message}`);
  }

};
//demo sample data for user creation

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
export const authenticateUser = async (email, password) => {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    if(typeof email !== 'string' || typeof password !== 'string'){
      throw new Error('Email and password must be strings');
    }
    if(email.trim()==="" || password.trim()===""){
      throw new Error('Email and password cannot be empty');
    }
    if (!isValidEmail(email) || !isValidPassword(password)) {
      throw new Error('Invalid email or password format');
    }
    console.log(password);
    
    email = email.trim();
    password = password.trim();
    
    let user = await User.findOne({ email });
    // console.log(user);
    if (!user) {
      throw new Error('User not found');
    }
    // console.log(user.password);
    
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }
    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id);
    let loggedInUser = await User.findOne({ email }).select('-password');

    return loggedInUser;
  } catch (error) {
    throw new Error(`Error authenticating user: ${error.message}`);
  }     
};

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


