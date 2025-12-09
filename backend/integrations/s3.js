import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createDocument } from "../data/documentController.js";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

export const uploadFileToS3 = async (file, groupId, createdBy) => {
  if (!file) {
    throw new Error("No file provided");
  }

  const key = `uploads/${Date.now()}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  const documentResult = await createDocument(
    groupId,
    null,
    createdBy,
    file.originalname,
    file.mimetype,
    file.size,
    key,
    url
  );

  return {
    documentId: documentResult.documentId,
  };
};

export const generateSignedUrlForKey = async (key) => {
  console.log("Generating signed URL for key:", key);
  if (!key || typeof key !== "string" || key.includes("..")) {
    throw new Error("Invalid S3 key");
  }

  await s3Client.send(
    new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: Number(process.env.S3_URL_EXPIRATION) || 3600,
  });

  return signedUrl;
};

export const deleteFileFromS3 = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    await s3Client.send(command);
    console.log(`Successfully deleted ${key} from S3`);
  } catch (error) {
    console.error("S3 delete error:", error);
    throw new Error(`Failed to delete from S3: ${error.message}`);
  }
};
