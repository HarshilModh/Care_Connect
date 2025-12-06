import { Document } from "../models/document.model.js";

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

    return {
      success: true,
      documentId: document._id,
      document,
    };
  } catch (error) {
    console.error("Create document error:", error);
    throw error;
  }
};
