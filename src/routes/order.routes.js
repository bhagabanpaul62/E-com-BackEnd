import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createOrder,
  createDirectOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
} from "../controllers/order.controllers.js";

const router = Router();

// Secure all order routes with JWT authentication
router.use(verifyJwt);

// Payment routes
router.post("/create-razorpay-order", createRazorpayOrder);
router.post("/verify-payment", verifyRazorpayPayment);

// Order routes
router.post("/create", createOrder);
router.post("/create-direct", createDirectOrder);
router.get("/", getUserOrders);
router.get("/:orderId", getOrderById);
router.patch("/:orderId/cancel", cancelOrder);

export default router;
