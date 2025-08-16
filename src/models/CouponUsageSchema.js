import mongoose from "mongoose";


const CouponUsageSchema = new mongoose.Schema({
    useId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"

    },
    couponId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"coupon"
    },
    usedCount : {
        type:Number,
        default:0,
    }
},{timestamps})

export const CouponUsage = mongoose.model("CouponUsage",CouponUsageSchema);