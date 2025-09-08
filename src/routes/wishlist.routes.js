import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkWishlistItem,
} from "../controllers/wishlist.controllers.js";

const router = Router();

// All wishlist routes require authentication
router.use(verifyJwt);

// Get user's wishlist
router.route("/").get(getUserWishlist);

// Add product to wishlist
router.route("/add").post(addToWishlist);

// Check if a product is in the wishlist
router.route("/check/:productId").get(checkWishlistItem);

// Remove product from wishlist
router.route("/remove/:productId").delete(removeFromWishlist);

// Clear wishlist
router.route("/clear").delete(clearWishlist);

export default router;
