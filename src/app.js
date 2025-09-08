import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || [
      "https://e-com-frontend-ebon-nine.vercel.app",
      "https://tajbee-gthpgdbrafekddhm.centralindia-01.azurewebsites.net",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:3004",
      "http://localhost:3005",
      "http://localhost:3006", // Added to support the current server port
    ],
    credentials: true, // allows cookies to be sent
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//Routes import
import userRouter from "./routes/user.routes.js";
import adminRouter from "./routes/admin.routes.js";
import reviewRouter from "./routes/review.routes.js";
import cartRouter from "./routes/cart.routes.js";
import wishlistRouter from "./routes/wishlist.routes.js";
import orderRouter from "./routes/order.routes.js";
import addressRouter from "./routes/address.routes.js";
import productRouter from "./routes/product.route.js";
import { verifyJwt } from "./middlewares/auth.middleware.js";
import { isAdmin } from "./middlewares/isAdmin.middleware.js";

//User Routes Declaration
app.use("/api/users", userRouter);

//Product Routes Declaration
app.use("/api/products", productRouter);

//Admin Routes Declaration
app.use("/api/admin", verifyJwt, isAdmin, adminRouter);

//Review Routes Declaration
app.use("/api/reviews", reviewRouter);

//Cart Routes Declaration
app.use("/api/cart", cartRouter);

//Wishlist Routes Declaration
app.use("/api/wishlist", wishlistRouter);

//Order Routes Declaration
app.use("/api/orders", orderRouter);

//Address Routes Declaration
app.use("/api/addresses", addressRouter);

// Debug endpoint for CORS testing
app.get("/api/debug/cors-test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CORS is working correctly",
    requestHeaders: {
      origin: req.headers.origin,
      host: req.headers.host,
      authorization: req.headers.authorization ? "Present" : "Missing"
    },
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to verify Razorpay configuration
app.get("/api/debug/razorpay-config", (req, res) => {
  try {
    // Safely show partial keys for debugging
    const keyIdSafe = process.env.RAZORPAY_KEY_ID ? 
      `${process.env.RAZORPAY_KEY_ID.substring(0, 8)}...` : "missing";
    const keySecretSafe = process.env.RAZORPAY_KEY_SECRET ? 
      `${process.env.RAZORPAY_KEY_SECRET.substring(0, 4)}...` : "missing";
    
    res.status(200).json({
      success: true,
      message: "Razorpay configuration",
      config: {
        keyId: keyIdSafe,
        keySecret: keySecretSafe,
        keyIdLength: process.env.RAZORPAY_KEY_ID?.length || 0,
        keySecretLength: process.env.RAZORPAY_KEY_SECRET?.length || 0,
        envVarsAvailable: !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking Razorpay configuration",
      error: error.message
    });
  }
});

export { app };
