import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    //email or phone
    identifier: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    isVerified:{
      type:Boolean,
      default:false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export const Otp = mongoose.model("Otp", OtpSchema);
