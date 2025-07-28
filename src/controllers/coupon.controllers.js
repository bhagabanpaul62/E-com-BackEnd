import { Coupon } from "../models/Coupon.model.js";
import { asyncHandler } from "../util/asyncHandler.js";
import {ApiResponse} from "../util/ApiResponse.js"

//CREATE COUPON 
export const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    discountType,
    amount,
    minPurchase,
    maxDiscountAmount,
    expiresAt,
    maxUsageLimit,
    userUsageLimit,
    status,
  } = req.body;

  // Enforce logic
  if (!code || !discountType || amount == null) {
    throw new ApiError(400, "Required fields missing");
  }

  if (discountType === "Flat" && maxDiscountAmount) {
    throw new ApiError(400, "Flat discount should not have maxDiscountAmount");
  }

  if (discountType === "Percentage" && (amount > 100 || amount <= 0)) {
    throw new ApiError(400, "Percentage must be between 1 and 100");
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase().trim(),
    discountType,
    amount,
    minPurchase: minPurchase || 0,
    maxDiscountAmount:
      discountType === "Percentage" ? maxDiscountAmount : undefined,
    expiresAt,
    maxUsageLimit,
    userUsageLimit: userUsageLimit || 1,
    status: status || "Active",
  });

  res.status(200).json(new ApiResponse(200, coupon));
});




