import { asyncHandler } from "../util/asyncHandler.js";
import { ApiError } from "../util/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import { ApiResponse } from "../util/ApiResponse.js";

export const validateToken = asyncHandler(async (req, res) => {
  try {
    // Get token from cookies first, fallback to Authorization header
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.header("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.replace("Bearer ", "").trim();
      }
    }

    if (!token) {
      throw new ApiError(401, "No token provided");
    }

    // Verify the token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Get user details
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid token - User not found");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: user,
          isAuthenticated: true,
        },
        "Token is valid"
      )
    );
  } catch (error) {
    // If token is expired, return specific error
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Token expired");
    }
    throw new ApiError(401, error?.message || "Invalid token");
  }
});
