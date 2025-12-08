import { Document } from "../models/document.model.js";
import { Membership } from "../models/memberShip.model.js";
import {
  generateSignedUrlForKey,
  deleteFileFromS3,
} from "../integrations/s3.js";
import mongoose from "mongoose";
import { createNotification } from "./notificationController.js";

export const createDocument = async (
  groupId,
  taskId,
  userId,
  fileName,
  fileType,
  fileSize,
  s3Key,
  s3Url
) => {
  try {
    const documentData = {
      groupId,
      taskId: taskId || null,
      uploadedBy: userId,
      originalName: fileName,
      mimeType: fileType,
      size: fileSize,
      key: s3Key,
      url: s3Url,
    };

    const document = new Document(documentData);
    await document.save();

    const userIds = await Membership.distinct("userId", { groupId });

    for (const recipientId of userIds) {
      try {
        await createNotification({
          type: "system",
          recipientId: recipientId.toString(),
          senderId: userId,
          groupId,
          title: `New Document Uploaded: ${fileName}`,
          message: `A new document "${fileName}" has been uploaded.`,
        });
      } catch (error) {
        console.error("Error creating notification:", error);
      }
    }

    return {
      success: true,
      documentId: document._id,
      document,
    };
  } catch (error) {
    console.error("Create document error:", error);
    throw new Error("Failed to create document: " + error.message);
  }
};

export const getUserDocumentsGroupedByGroup = async (userId) => {
  if (!userId) {
    throw new Error("userId is required to fetch documents");
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }

  const memberships = await Membership.find({
    userId,
    status: "active",
  }).select("groupId");

  const groupIds = memberships.map((m) => m.groupId).filter(Boolean);

  if (groupIds.length === 0) {
    return {};
  }
  const docs = await Document.find({
    groupId: { $in: groupIds },
  })
    .populate({
      path: "groupId",
      select: "groupName",
    })
    .populate({
      path: "uploadedBy",
      select: "email firstName lastName",
    })
    .lean();
  const grouped = {};

  try {
    for (const doc of docs) {
      if (!doc.groupId || !doc.groupId.groupName) continue;

      const tempUrl = await generateSignedUrlForKey(doc.key);
      doc.url = tempUrl;

      const groupName = doc.groupId.groupName;

      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }

      grouped[groupName].push(doc);
    }
  } catch (error) {
    throw new Error("Error generating signed URLs: " + error.message);
  }

  return grouped;
};

export const deleteDocument = async (documentId, userId) => {
  try {
    if (!documentId) {
      throw new Error("documentId is required");
    }
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new Error("Invalid documentId");
    }
    if (!userId) {
      throw new Error("userId is required");
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId");
    }
  } catch (error) {
    console.log("Validation error:", error);
    throw new Error("Validation failed: " + error.message);
  }

  try {
    const document = await Document.findOne({
      _id: documentId,
      uploadedBy: userId,
    });

    if (!document) {
      throw new Error(
        "Document not found or you do not have permission to delete it"
      );
    }

    await deleteFileFromS3(document.key);

    await Document.deleteOne({ _id: documentId });

    return {
      success: true,
      message: "Document deleted successfully",
      documentId,
    };
  } catch (error) {
    console.error("Delete document error:", error);
    throw new Error("Failed to delete document: " + error.message);
  }
};
