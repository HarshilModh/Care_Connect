import dotenv from "dotenv";
import fs from "fs";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Setup multer for temp file storage
const upload = multer({ dest: "uploads/" });

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const url = async (public_Id) => {
  return cloudinary.url(public_Id, {
    transformation: [
      {
        fetch_format: "auto", // asking cloudinary to deliver the most efficient format for that browser or device. (Ex : jpeg to webp)
        quality: "auto",
      },
      {
        width: 1200,
        height: 1200,
        crop: "fill",
        gravity: "auto",
      },
    ],
  });
};

export const userImage = async (imagePath) => {
  const results = await cloudinary.uploader.upload(imagePath, {
    folder: "care_connect", // created a folder in cloudinary that will store all images related to care_connect.
  });
  const finalURL = await url(results.public_id);
  console.log(finalURL);
  return finalURL;
};

export const uploadImagesGuard = (req, res, next) => {
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "newImages", maxCount: 5 },
  ])(req, res, (err) => {
    if (err) {
      if (
        err instanceof multer.MulterError &&
        err.code === "LIMIT_UNEXPECTED_FILE"
      ) {
        req.session.toast = {
          type: "error",
          message: "You can only upload up to 5 images.",
        };
        return res.status(400).json({ error: "Too many images" });
      }
      req.session.toast = {
        type: "error",
        message: "Failed to process images: " + err.message,
      };
      return res.status(500).json({ error: err.message });
    }
    next();
  });
};
