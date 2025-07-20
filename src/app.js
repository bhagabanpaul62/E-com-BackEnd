import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"



const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//Routes import 
import categoryRoute from "./routes/category.routes.js"
import productRoute from "./routes/product.route.js"
import userRouter from"./routes/user.routes.js"

//Routes Declaration
app.use("/api/users",userRouter)
app.use("/api/category",categoryRoute)
app.use("/api/product",productRoute)


export {app}