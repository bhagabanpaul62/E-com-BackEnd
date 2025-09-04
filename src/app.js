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
import { verifyJwt } from "./middlewares/auth.middleware.js";
import { isAdmin } from "./middlewares/isAdmin.middleware.js";

//User Routes Declaration
app.use("/api/users", userRouter);

//Admin Routes Declaration
app.use("/api/admin", verifyJwt, isAdmin, adminRouter);

//Review Routes Declaration
app.use("/api/reviews", reviewRouter);

//Cart Routes Declaration
app.use("/api/cart", cartRouter);

export { app };
