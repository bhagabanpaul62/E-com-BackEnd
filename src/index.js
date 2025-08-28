import dotenv from "dotenv";
import connectDB from "./DB/index.js";
import { app } from "./app.js";
import fs from "fs";
import path from "path";

dotenv.config();

// Ensure required directories exist
const ensureDirectoriesExist = () => {
  const tempDir = path.join(process.cwd(), "public", "temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`📁 Created temp directory: ${tempDir}`);
  }
};

// Handle crashes globally
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

// Ensure directories exist before starting
ensureDirectoriesExist();

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.error("❌ Server error:", error);
      throw error;
    });

    const PORT = process.env.PORT || 5000;

    // ✅ Important for Azure: listen on 0.0.0.0, not just localhost
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ ERROR IN DB:", err);
    process.exit(1);
  });
