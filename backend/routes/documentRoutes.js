import express from "express";
import multer from "multer";
import {
  generateSignedUrlForKey,
  uploadFileToS3,
} from "../data/documentController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { key, url } = await uploadFileToS3(file);

    return res.json({
      success: true,
      key,
      url,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Upload failed" });
  }
});

router.get("/signedUrl/*", async (req, res) => {
  try {
    const key = req.params[0];
    const signedUrl = await generateSignedUrlForKey(key);
    return res.json({ signedUrl });
  } catch (error) {
    if (error.name === "NotFound" || /404/.test(error.message)) {
      return res.status(404).json({ error: "File not found in S3" });
    }
    console.error("Signed URL error:", error);
    return res.status(500).json({ error: "Signed URL failed" });
  }
});

export default router;
