import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";



export const dashBoard = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, "i am in dashboard"));
});



