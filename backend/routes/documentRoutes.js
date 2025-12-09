import express from "express";
import multer from "multer";
import {
  getUserDocumentsGroupedByGroup,
  deleteDocument,
} from "../data/documentController.js";

import { uploadFileToS3 } from "../integrations/s3.js";

const router = express.Router();

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

const uploadDataFiles = upload.array("dataFiles");

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const groupedDocs = await getUserDocumentsGroupedByGroup(userId);
    return res.status(200).json(groupedDocs);
  } catch (error) {
    console.error("Error fetching user documents:", error);
    const status =
      error.message.includes("userId is required") ||
      error.message.includes("Invalid userId")
        ? 400
        : 500;
    return res
      .status(status)
      .json({ error: "Failed to fetch user documents: " + error.message });
  }
});

router.post("/", uploadDataFiles, async (req, res) => {
  try {
    const { userId, groupId } = req.body;

    if (!userId || !groupId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId and groupId are required.",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No files uploaded. Please attach at least one file.",
      });
    }

    const filesToUpload = req.files;
    const attachments = [];

    console.log(
      `Uploading ${filesToUpload.length} files for user: ${userId}, group: ${groupId}`
    );

    for (const file of filesToUpload) {
      if (file.size > MAX_FILE_SIZE) {
        return res
          .status(400)
          .json({
            success: false,
            error: "Each file must be 10 MB or smaller.",
          });
      }

      try {
        const { documentId } = await uploadFileToS3(file, groupId, userId);
        attachments.push(documentId);
      } catch (err) {
        console.error("Error uploading file to S3:", err);
        return res.status(500).json({
          success: false,
          error: `Failed to upload file: ${file.originalname}`,
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: "Files uploaded successfully.",
      attachments,
    });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "Each file must be 10 MB or smaller.",
      });
    }

    console.error("Unexpected error in file upload route:", err);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred while uploading files.",
    });
  }
});

router.delete("/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required in request body",
      });
    }

    const result = await deleteDocument(documentId, userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
