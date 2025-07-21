//this middleware verify the use are logined or not

import jwt from "jsonwebtoken";
import { ApiError } from "../util/ApiError.js";
import { User } from "../models/User.model.js";
import { asyncHandler } from "../util/asyncHandler.js";


export const verifyJwt =asyncHandler( async(req,res,next)=>{
  try {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","").trim();
      console.log("our token is", token);
      
      if (!token){
          throw new ApiError (401,"Unauthorize Access")
      }
  
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
  
      if(!user){
          throw new ApiError(401,"invalid access token")
      }
  
      req.user = user;
  
      next();
  } catch (error) {
    throw new ApiError(401,error?.message||"invalid access token")
  }
})