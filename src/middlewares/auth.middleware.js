//this middleware verify the use are logined or not

import jwt from "jsonwebtoken";
import { ApiError } from "../util/ApiError.js";
import { User } from "../models/User.model.js";
import { asyncHandler } from "../util/asyncHandler.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    // Check multiple sources for the token
    let token = req.cookies?.accessToken;

    // If not in cookies, check Authorization header
    if (!token) {
      const authHeader = req.header("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.replace("Bearer ", "").trim();
      }
    }

    console.log("🔐 Auth token:", token);

    if (!token) {
      throw new ApiError(401, "Unauthorized Access - No token provided");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("🔓 Decoded token:", decodedToken);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token - User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("🚫 Auth error:", error);
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
