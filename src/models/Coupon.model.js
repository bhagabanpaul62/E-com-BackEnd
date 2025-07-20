import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    discountType: {
      type: String,
      enum: ["Flat", "Percentage"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    minPurchase: {
      type: Number,
      default: 0,
    },

    maxDiscountAmount: {
      type: Number,
      min: 0,
      // Used when discountType = Percentage
    },

    expiresAt: {
      type: Date,
    },

    maxUsageLimit: {
      type: Number, // Per coupon
      min: 1,
    },

    usedCount: {
      type: Number,
      default: 0,
    },

    userUsageLimit: {
      type: Number, // Per user
      default: 1,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export const Coupon = mongoose.model("Coupon", CouponSchema);
