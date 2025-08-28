import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

//upload file

const uploadCloudinary = async (localPath) => {
  try {
    // Check if file exists before attempting upload
    if (!fs.existsSync(localPath)) {
      console.error(`❌ File not found: ${localPath}`);
      return null;
    }

    console.log(`📤 Uploading file to Cloudinary: ${localPath}`);
    const response = await cloudinary.uploader.upload(localPath, {
      resource_type: "auto",
    });
    console.log("✅ File uploaded to Cloudinary:", response.url);

    // Clean up temp file after successful upload
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      console.log(`🗑️ Cleaned up temp file: ${localPath}`);
    }
    return response;
  } catch (err) {
    console.error(`❌ Cloudinary upload failed for ${localPath}:`, err);
    // Clean up temp file even if upload failed
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      console.log(`🗑️ Cleaned up temp file after error: ${localPath}`);
    }
    return null;
  }
};

export { uploadCloudinary };
