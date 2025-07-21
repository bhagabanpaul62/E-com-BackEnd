import { ApiError } from "../util/ApiError";
import { asyncHandler } from "../util/asyncHandler";


export const isAdmin =asyncHandler((req,res,next)=>{
    if(!req.user || !req.user.isAdmin){
        throw new ApiError(400,"unauthorize access you are not admin")
    }

    next()

}) 