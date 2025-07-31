import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
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
