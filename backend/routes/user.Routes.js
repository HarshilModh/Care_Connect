import {
  createUser,
  authenticateUser,
  getUserById,
  updateUser,
  logoutUser,
  refreshToken,
  changeUserPassword,
  authenticateUserWithGoogle,
  searchUsersByEmail,
  resetUserPassword,
  deleteUser,
} from "../data/userController.js";
import { requireAuth, verifyFirebaseToken } from "../middlewares/auth.js";
import express from "express";
import admin from "../integrations/firebaseAdmin.js";
import User from "../models/user.model.js";
import { isValidEmail } from "../utils/validation.utils.js";

const router = express.Router();

// Route to create a new user
router.post("/signUp", async (req, res) => {
  try {
    console.log("In signup route");
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      needPasswordReset,
      firebaseUid,
    } = req.body;

    console.log("Received data:", {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      needPasswordReset,
      firebaseUid,
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

    const newUser = await createUser(
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      needPasswordReset,
      firebaseUid
    );
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to authenticate a user
router.post("/login", async (req, res) => {
  try {
    let email = req.body.email;
    let password = req.body.password;
    if (!email || !password) {
      throw new Error("Email and password are required");
    }
    if (typeof email !== "string" || typeof password !== "string") {
      throw new Error("Email and password must be strings");
    }
    if (email.trim() === "" || password.trim() === "") {
      throw new Error("Email and password cannot be empty");
    }

    email = email.trim().toLowerCase();
    password = password.trim();
    console.log("Attempting login for:", email);
    const authResult = await authenticateUser(email, password);
    res.status(200).json(authResult);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});
//search user by email
router.get("/search/:email", async (req, res) => {
  try {
    let email = req.params.email;
    if (!email) {
      throw new Error("Email parameter is required");
    }
    if (typeof email !== "string") {
      throw new Error("Email must be a string");
    }
    if (email.trim() === "") {
      throw new Error("Email cannot be empty");
    }
    email = email.trim().toLowerCase();
    // if(!isValidEmail(email)) {
    //   throw new Error("Invalid email format");
    // }
    const users = await searchUsersByEmail(email);
    res.status(200).json(users);
  } catch (error) {
    console.log("Error searching users by email:", error);
    res.status(400).json({ error: error.message });
  }
});

router.get("/search/", verifyFirebaseToken, async (req, res, next) => {
  try {
    const { email } = req.query;
    console.log("Email:>>>", email);

    if (!email) {
      return res
        .status(400)
        .json({ error: "Email query parameter is required" });
    }

    if (typeof email !== "string" || email.trim() === "") {
      return res
        .status(400)
        .json({ error: "Email must be a non-empty string" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const users = await searchUsersByEmail(email);
    console.log("Fetched User using email >>>", users);
    return res.status(200).json(users);
  } catch (e) {
    console.error("Error searching users by email:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// /users/profile?googleId=user.uid

router.get("/profile/", requireAuth, async (req, res, next) => {
  try {
    const { googleId } = req.query;
    console.log("Google ID:>>>", googleId);

    const user = await User.findOne({ firebaseUid: googleId }).select(
      "_id firstName lastName email role isVerified displayName"
    );

    console.log("Fetched User:>>>", user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (e) {
    next(e);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const me = await getUserById(req.user._id);
    res.status(200).json(me);
  } catch (e) {
    next(e);
  }
});

router.patch("/me", async (req, res, next) => {
  try {
    let id = req.body.id;
    let firstname = req.body.firstName;
    let lastname = req.body.lastName;
    let email = req.body.email;
    let firebaseUid = req.body.firebaseUid;

    console.log("In update route", id, firstname, lastname, email, firebaseUid);
    const updateData = {
      firstName: firstname,
      lastName: lastname,
      email: email,
      firebaseUid: firebaseUid,
    };
    const updated = await updateUser(id, updateData);
    res.status(200).json(updated);
  } catch (e) {
    next(e);
  }
});

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const out = await logoutUser(req.user._id);
    res.status(200).json(out);
  } catch (e) {
    next(e);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken: oldRefreshToken } = req.body || {};
    if (!oldRefreshToken)
      return res.status(400).json({ error: "Refresh token required" });
    const tokens = await refreshToken(oldRefreshToken);
    res.status(200).json(tokens);
  } catch (e) {
    next(e);
  }
});

router.patch("/me/password", requireAuth, async (req, res, next) => {
  try {
    const { newPassword } = req.body || {};
    if (!newPassword) {
      return res.status(400).json({ error: "password is required" });
    }
    const result = await changeUserPassword(req.user._id, newPassword);
    res.status(200).json(result); // { ok: true }
  } catch (e) {
    next(e);
  }
});

router.patch("/me/reset_passoword", async (req, res) => {
  try {
    console.log("<>><>");
    const { email, password } = req.body || {};
    console.log("email?>>>", email, password);
    const result = await resetUserPassword(email, password);
    res.status(200).json(result);
    console.log("password");
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
});

router.post("/google", verifyFirebaseToken, async (req, res, next) => {
  try {
    const { idToken } = req.body || {};
    console.log("idtoken from google route", idToken);
    console.log("firstToken", idToken, req.body);
    if (!idToken) return res.status(400).json({ error: "ID token required" });
    // Call the controller function to handle Google sign-in
    const authResult = await authenticateUserWithGoogle(idToken);
    res.status(200).json(authResult);
  } catch (e) {
    next(e);
  }
});

router.post("/verify-email", verifyFirebaseToken, async (req, res) => {
  try {
    console.log("📧 Syncing email verification for:", req.firebaseUser);

    // Find or create user
    let user = await User.findOne({ email: req.firebaseUser.email });
    console.log("firstUser", user);

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        firebaseUid: req.user.uid,
        email: req.user.email,
        emailVerified: true,
        verifiedAt: new Date(),
      });
      console.log("✅ Created new user in MongoDB");
    } else {
      // Update existing user
      user.isVerified = true;
      await user.save();
      console.log("✅ Updated user verification status");
    }

    res.status(200).json({
      success: true,
      message: "Email verification synced",
      user: {
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("❌ Verification sync error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync verification",
      details: error.message,
    });
  }
});
router.delete("/delete/:id", requireAuth, async (req, res) => {
  try {
    console.log("in delete Routes");

    const userId = req.params.id;
    if (req.user._id.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this user" });
    }
    const result = await deleteUser(userId);
    res.status(200).json({ message: "User deleted successfully", result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
