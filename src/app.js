import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
//my files 
import categoryRoute from "./routes/category.routes.js"
import productRoute from "./routes/product.route.js"

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.use("/api/category",categoryRoute)
app.use("/api/product",productRoute)


export {app}