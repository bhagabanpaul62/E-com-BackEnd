import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();


app.use(
  cors({
    origin: "https://e-com-lemon-omega.vercel.app", // your Vercel domain
    credentials: true, // allows cookies to be sent
  })
);

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//Routes import 
import userRouter from"./routes/user.routes.js"
import adminRouter from"./routes/admin.routes.js"
import { verifyJwt } from "./middlewares/auth.middleware.js";
import { isAdmin } from "./middlewares/isAdmin.middleware.js";

//User Routes Declaration
app.use("/api/users",userRouter)

//Admin Routes Declaration
app.use("/api/admin", verifyJwt,isAdmin,adminRouter);



export {app}