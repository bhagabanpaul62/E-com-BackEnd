import { Order } from "../models/Order.model.js";
import { Address } from "../models/Address.model.js";
import { Cart } from "../models/Cart.model.js";
import { Product } from "../models/Product.model.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// Log Razorpay keys for debugging (remove in production)
console.log("Razorpay Config:", {
  key_id: process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID.substring(0, 8)}...` : "missing",
  key_secret: process.env.RAZORPAY_KEY_SECRET ? `${process.env.RAZORPAY_KEY_SECRET.substring(0, 4)}...` : "missing",
});

// Log Razorpay keys for debugging (remove in production)
console.log("Razorpay Config:", {
  key_id: process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID}` : "missing",
  key_secret: process.env.RAZORPAY_KEY_SECRET ? `${process.env.RAZORPAY_KEY_SECRET.substring(0, 4)}...` : "missing",
});

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount, currency = "INR" } = req.body;

  if (!amount) {
    throw new ApiError(400, "Amount is required");
  }

  // Log request details for debugging
  console.log("Razorpay order request:", {
    amount,
    currency,
    userId: req.user?._id,
    razorpayConfigured: !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET
  });
  
  // Log the actual keys being used (first few characters)
  console.log("Using Razorpay credentials:", {
    key_id: process.env.RAZORPAY_KEY_ID || "missing",
    key_secret: process.env.RAZORPAY_KEY_SECRET ? `${process.env.RAZORPAY_KEY_SECRET.substring(0, 4)}...` : "missing"
  });

  // Format the amount exactly as required by Razorpay
  const amountInPaise = Math.round(amount * 100);
  
  const options = {
    amount: amountInPaise, // Amount in paise
    currency,
    receipt: `receipt_${Date.now()}`,
  };
  
  // Double-check the options format
  console.log("Final Razorpay options:", JSON.stringify(options));

  try {
    // Check if Razorpay keys are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay keys are missing in environment variables");
      return res.status(500).json({
        success: false,
        message: "Payment gateway configuration error",
        details: {
          keyIdPresent: !!process.env.RAZORPAY_KEY_ID,
          keySecretPresent: !!process.env.RAZORPAY_KEY_SECRET
        }
      });
    }

    console.log("Creating Razorpay order with options:", options);
    
    try {
      // Explicitly create a Razorpay instance with hardcoded keys for testing
      // This ensures no environment variable loading issues
      const freshRazorpay = new Razorpay({
        key_id: "rzp_test_KDN5uTNLu5ZbaY",
        key_secret: "fPKTAuJmq1WvpNSQruEEtxsM",
      });
      
      console.log("Created Razorpay instance with hardcoded keys for testing");
      
      const order = await freshRazorpay.orders.create(options);
      console.log("Razorpay order created successfully:", order.id);
      res.status(200).json(new ApiResponse(200, order, "Razorpay order created"));
    } catch (razorpayError) {
      console.error("Razorpay API error:", razorpayError);
      return res.status(500).json({
        success: false,
        message: "Razorpay order creation failed",
        error: razorpayError.message || "Unknown Razorpay error",
        details: razorpayError
      });
    }
  } catch (error) {
    console.error("Error in order creation controller:", error);
    return res.status(500).json({
      success: false, 
      message: `Failed to create Razorpay order: ${error.message || "Unknown error"}`,
      error: error.message || "Unknown error"
    });
  }
});

// Verify Razorpay payment
export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    res
      .status(200)
      .json(new ApiResponse(200, { verified: true }, "Payment verified"));
  } else {
    throw new ApiError(400, "Invalid payment signature");
  }
});

// Create order
export const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    shippingAddressId,
    paymentMethod,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    deliveryType = "Normal",
  } = req.body;

  // Validate required fields
  if (!shippingAddressId || !paymentMethod) {
    throw new ApiError(400, "Shipping address and payment method are required");
  }

  // Verify address belongs to user
  const address = await Address.findOne({ _id: shippingAddressId, userId });
  if (!address) {
    throw new ApiError(400, "Invalid shipping address");
  }

  // Get user's cart
  const cart = await Cart.findOne({ userId }).populate({
    path: "items.productId",
    select: "name mainImage price discountPercentage variants",
  });

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  // Calculate totals
  let subTotal = 0;
  const orderProducts = [];

  for (const item of cart.items) {
    const product = item.productId;
    const finalPrice = product.discountPercentage
      ? product.price * (1 - product.discountPercentage / 100)
      : product.price;

    const itemTotal = finalPrice * item.quantity;
    subTotal += itemTotal;

    orderProducts.push({
      productId: product._id,
      variantId: item.variantId,
      quantity: item.quantity,
      price: itemTotal,
    });
  }

  // Calculate shipping charges
  const shippingCharges =
    deliveryType === "Express" ? 99 : subTotal < 500 ? 40 : 0;
  const totalAmount = subTotal + shippingCharges;

  // Verify payment if not COD
  if (paymentMethod !== "COD") {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(400, "Payment verification details are required");
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(400, "Invalid payment signature");
    }
  }

  // Generate unique invoice ID
  const invoiceId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Create order
  const order = await Order.create({
    userId,
    products: orderProducts,
    shippingAddress: shippingAddressId,
    deliveryType,
    estimatedDays: deliveryType === "Express" ? 2 : 7,
    shippingCharges,
    subTotal,
    totalAmount,
    paymentMethod: paymentMethod.toUpperCase(),
    paymentStatus: paymentMethod === "COD" ? "Pending" : "Success",
    invoiceId,
  });

  // Clear cart after successful order
  await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

  // Populate order details for response
  const populatedOrder = await Order.findById(order._id)
    .populate("shippingAddress")
    .populate({
      path: "products.productId",
      select: "name mainImage images price discountPercentage description",
    });

  res
    .status(201)
    .json(new ApiResponse(201, populatedOrder, "Order created successfully"));
});

// Get user orders
export const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const orders = await Order.find({ userId })
    .populate("shippingAddress")
    .populate({
      path: "products.productId",
      select: "name mainImage images price discountPercentage",
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Order.countDocuments({ userId });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        orders,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      },
      "Orders fetched successfully"
    )
  );
});

// Get order by ID
export const getOrderById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { orderId } = req.params;

  const order = await Order.findOne({ _id: orderId, userId })
    .populate("shippingAddress")
    .populate({
      path: "products.productId",
      select: "name mainImage images price discountPercentage description",
    });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, order, "Order fetched successfully"));
});

// Cancel order
export const cancelOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { orderId } = req.params;

  const order = await Order.findOne({ _id: orderId, userId });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.orderStatus === "Delivered" || order.orderStatus === "Canceled") {
    throw new ApiError(400, "Order cannot be canceled");
  }

  order.orderStatus = "Canceled";
  await order.save();

  res
    .status(200)
    .json(new ApiResponse(200, order, "Order canceled successfully"));
});

// Create direct order for a single product
export const createDirectOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    shippingAddressId,
    paymentMethod,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    deliveryType = "Normal",
    productId,
    quantity = 1,
  } = req.body;

  // Validate required fields
  if (!shippingAddressId || !paymentMethod || !productId) {
    throw new ApiError(400, "Shipping address, payment method, and product ID are required");
  }

  // Verify address belongs to user
  const address = await Address.findOne({ _id: shippingAddressId, userId });
  if (!address) {
    throw new ApiError(400, "Invalid shipping address");
  }

  // Get product details
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Calculate price
  const finalPrice = product.discountPercentage
    ? product.price * (1 - product.discountPercentage / 100)
    : product.price;

  const itemTotal = finalPrice * quantity;
  const subTotal = itemTotal;

  // Create order products array with single item
  const orderProducts = [{
    productId: product._id,
    quantity: quantity,
    price: itemTotal,
  }];

  // Calculate shipping charges
  const shippingCharges =
    deliveryType === "Express" ? 99 : subTotal < 500 ? 40 : 0;
  const totalAmount = subTotal + shippingCharges;

  // Verify payment if not COD
  if (paymentMethod !== "COD") {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(400, "Payment verification details are required");
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(400, "Invalid payment signature");
    }
  }

  // Generate unique invoice ID
  const invoiceId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Create order
  const order = await Order.create({
    userId,
    products: orderProducts,
    shippingAddress: shippingAddressId,
    deliveryType,
    estimatedDays: deliveryType === "Express" ? 2 : 7,
    shippingCharges,
    subTotal,
    totalAmount,
    paymentMethod: paymentMethod.toUpperCase(),
    paymentStatus: paymentMethod === "COD" ? "Pending" : "Success",
    invoiceId,
  });

  // Populate order details for response
  const populatedOrder = await Order.findById(order._id)
    .populate("shippingAddress")
    .populate({
      path: "products.productId",
      select: "name mainImage images price discountPercentage description",
    });

  res
    .status(201)
    .json(new ApiResponse(201, populatedOrder, "Direct order created successfully"));
});
