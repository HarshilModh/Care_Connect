// integrations/firebaseAdmin.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const serviceAccountPath = path.resolve("./dbConfig/serviceAccountKey.json");

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  console.log("Firebase Admin initialized (integrations)");
} else {
  console.warn(
    "Firebase service account file not found at:",
    serviceAccountPath
  );
  // IMPORTANT: don't throw or exit here – let the app start without Firebase
}

export default admin;

