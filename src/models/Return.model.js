import mongoose from "mongoose";

const ReturnSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required:true,
    },
    ProductID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required:true,
    },
    variantId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    reason:{
        type:String,
    },
    status:{
        type:String,
        enum:["Requested","Approved","Rejected","Refunded"],
        default:"Requested"
    }
  },
  { timestamps: true }
);

export const Return = mongoose.model("Return",ReturnSchema)