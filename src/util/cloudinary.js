import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
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
    return response;
  } catch (err) {
    fs.unlinkSync(localPath);
    return null;
  }
};

export { uploadCloudinary };
