import { Router } from "express";
import {
  createReview,
  getProductReviews,
  getUserReview,
  updateReview,
  deleteReview,
  getUserReviews,
  adminReplyToReview,
  getAllReviewsForAdmin,
} from "../controllers/review.controllers.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.middleware.js";

const router = Router();

// Public routes
router.route("/product/:productId").get(getProductReviews);

// Protected routes (require authentication)
router.route("/create").post(verifyJwt, createReview);
router.route("/user/:productId").get(verifyJwt, getUserReview);
router.route("/user").get(verifyJwt, getUserReviews);
router.route("/:reviewId").patch(verifyJwt, updateReview);
router.route("/:reviewId").delete(verifyJwt, deleteReview);

// Admin routes
router
  .route("/admin/reply/:reviewId")
  .post(verifyJwt, isAdmin, adminReplyToReview);
router.route("/admin/all").get(verifyJwt, isAdmin, getAllReviewsForAdmin);

export default router;
