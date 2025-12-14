import jwt from "jsonwebtoken";
import admin from "../integrations/firebaseAdmin.js";
import User from "../models/user.model.js";

export const requireAuth = async (req, res, next) => {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing access token" });
  }

  try {
    const p = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = { _id: p._id, email: p.email, role: p.role };
    return next();
  } catch (jwtError) {
    try {
      const decoded = await admin.auth().verifyIdToken(token);

      const user = await User.findOne({ uid: decoded.uid }).select(
        "_id email role firstName lastName"
      );

      if (!user) {
        return res.status(401).json({ error: "User not found in system" });
      }

      req.user = user;
      req.firebaseUser = decoded;
      return next();
    } catch (firebaseError) {
      console.error("Authentication failed:", firebaseError);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  }
};

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    // console.log("Decoded Firebase token:", decoded);
    req.firebaseUser = decoded;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(403).json({ error: "Invalid or expired Firebase ID token" });
  }
};
