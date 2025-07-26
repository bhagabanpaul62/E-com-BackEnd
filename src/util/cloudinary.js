import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv"
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
    const response = await cloudinary.uploader.upload(localPath, {
      resource_type: "auto",
    });
    console.log("file is uploaded in cloudinary", response.url);
     if (fs.existsSync(localPath)) {
       fs.unlinkSync(localPath);
     }
    return response;
  } catch (err) {
     if (fs.existsSync(localPath)) {
       fs.unlinkSync(localPath);
     }
    return null;
  }
};

export { uploadCloudinary };
