import { createUser, authenticateUser } from '../data/userController.js';
import express from 'express';

const router = express.Router();

// Route to create a new user
router.post('/signUp', async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;
    console.log(">>", req.body);
    const newUser = await createUser(firstName, lastName, email, password, confirmPassword);
    res.status(201).json({ message: 'User created successfully', userId: newUser._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to authenticate a user
router.post('/login', async (req, res) => {
  try {
    let email = req.body.email;
    let password = req.body.password;
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new Error('Email and password must be strings');
    }
    if (email.trim() === "" || password.trim() === "") {
      throw new Error('Email and password cannot be empty');
    }
    email = email.trim();
    password = password.trim();
    const authResult = await authenticateUser(email, password);
    res.status(200).json(authResult);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

export default router;