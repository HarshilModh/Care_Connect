import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
    try {      
        await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log(`Connected to MongoDB care_connect_db`);
    } catch (error) {
        console.log('Error connecting to MongoDB', error);
        process.exit(1);
    }
};
