import mongoose from "mongoose";

const OrderedProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number, // price = variantFinalPrice * quantity
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    products: [OrderedProductSchema],

    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },

    deliveryType: {
      type: String,
      enum: ["Express", "Normal"],
      default: "Normal",
    },

    estimatedDays: Number,
    shippingCharges: {
      type: Number,
      default: 0,
    },

    // 💰 Order Price Breakdown
    subTotal: {
      type: Number,
      required: true,
    },
    couponCode: {
      type: String,
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },

    // 💳 Payment
    paymentMethod: {
      type: String,
      enum: ["CARD", "UPI", "COD"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Success", "Rejected"],
      default: "Pending",
    },

    // 📦 Tracking
    invoiceId: {
      type: String,
      unique: true,
    },
    trackingId: String,

    adminNote: String,

    orderStatus: {
      type: String,
      enum: ["Placed", "Shipped", "Delivered", "Canceled"],
      default: "Placed",
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", OrderSchema);
