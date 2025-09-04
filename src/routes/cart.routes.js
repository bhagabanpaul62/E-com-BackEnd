import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getUserCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controllers.js";

const router = Router();

// Secure all cart routes with JWT authentication
router.use(verifyJwt);

// Get user's cart
router.get("/", getUserCart);

// Add item to cart
router.post("/add", addToCart);

// Update cart item quantity
router.put("/update", updateCartItem);

// Remove item from cart
router.delete("/remove/:productId", removeFromCart);
router.delete("/remove/:productId/:variantId", removeFromCart);

// Clear cart
router.delete("/clear", clearCart);

export default router;
