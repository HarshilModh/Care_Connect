// firebaseAdmin.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// The service account key is never committed. Provide it in one of two ways:
//   FIREBASE_SERVICE_ACCOUNT_JSON  the key file's JSON as a single line
//   FIREBASE_SERVICE_ACCOUNT_PATH  a path to the key file (defaults to ./dbconfig/serviceAccountKey.json)
const loadServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  const serviceAccountPath = path.resolve(
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./dbconfig/serviceAccountKey.json"
  );
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(
      "Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH. Looked at:",
      serviceAccountPath
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
};

//  Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(loadServiceAccount()),
  });
  console.log("Firebase Admin initialized successfully");
}

const firebaseAuth = admin.auth();
export { firebaseAuth };
export default admin;
