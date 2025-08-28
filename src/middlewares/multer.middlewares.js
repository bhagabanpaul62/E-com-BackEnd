import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure temp directory exists
const tempDir = path.join(process.cwd(), "public", "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log(`📁 Created temp directory: ${tempDir}`);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use absolute path to ensure it works in production
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Preserve original field name in the file object
    const fieldName = file.fieldname;
    console.log(`📁 Processing file upload for field: ${fieldName}`);
    const newName = Date.now() + file.originalname;
    cb(null, newName);
  },
});

export const upload = multer({
  storage,
  preservePath: true, // This helps preserve the full field name
});
