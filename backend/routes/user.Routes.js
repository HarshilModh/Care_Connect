import { createUser, authenticateUser, getUserById, updateUser, logoutUser, refreshToken, changeUserPassword } from '../data/userController.js';
import { requireAuth } from '../middlewares/auth.js';
import express from 'express';

const router = express.Router();

// Route to create a new user
router.post('/signUp', async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, phone } = req.body;
    const newUser = await createUser(firstName, lastName, email, password, confirmPassword, phone);
    res.status(201).json({ message: 'User created successfully', user: newUser });
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
    email = email.trim().toLowerCase();
    password = password.trim();
    const authResult = await authenticateUser(email, password);
    res.status(200).json(authResult);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const me = await getUserById(req.user._id);
    res.json(me);
  } catch (e) { next(e); }
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const updated = await updateUser(req.user._id, req.body);
    res.json(updated);
  } catch (e) { next(e); }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const out = await logoutUser(req.user._id);
    res.json(out);
  } catch (e) { next(e); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken: oldRefreshToken } = req.body || {};
    if (!oldRefreshToken) return res.status(400).json({ error: 'Refresh token required' });
    const tokens = await refreshToken(oldRefreshToken);
    res.json(tokens);
  } catch (e) { next(e); }
});

router.patch('/me/password', requireAuth, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Both oldPassword and newPassword are required' });
    }
    const result = await changeUserPassword(req.user._id, oldPassword, newPassword);
    res.json(result); // { ok: true }
  } catch (e) { next(e); }
});


export default router;