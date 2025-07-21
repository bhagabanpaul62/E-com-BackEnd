import {Router} from "express";
import { registerUser, sendOtp ,OtpValidation, login, logout, refreshAccessToken } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middlewares.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();




router.route("/send-otp").post(sendOtp);
router.route("/verify-otp").post(OtpValidation);
router.route("/register").post(
    upload.fields([
        {
           name : "profileImage",
           maxCount:1,
        }
    ]),   
    registerUser
)
router.route("/login").post( login);
router.route("/logout").post(verifyJwt,logout);
router.route("/refresh-token").post(refreshAccessToken)


export default router;