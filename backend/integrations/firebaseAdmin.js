// firebaseAdmin.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const serviceAccountPath = path.resolve("./dbconfig/serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error(
    "Firebase service account file not found at:",
    serviceAccountPath
  );
  process.exit(1);
}

//  Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"))
    ),
  });
  console.log("Firebase Admin initialized successfully");
}

export default admin;
