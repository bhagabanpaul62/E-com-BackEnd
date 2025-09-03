import { Review } from "../models/Review.model.js";
import { Product } from "../models/Product.model.js";
import { Order } from "../models/Order.model.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";
import mongoose from "mongoose";

// Create a new review
const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.body;
  const userId = req.user._id;

  if (!productId || !rating) {
    throw new ApiError(400, "Product ID and rating are required");
  }

  if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Check if user has already reviewed this product
  const existingReview = await Review.findOne({ productId, userId });
  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this product");
  }

  // Check if user has purchased this product (for verified purchase)
  const order = await Order.findOne({
    userId,
    "items.productId": productId,
    orderStatus: "Delivered",
  });
  const isVerifiedPurchase = !!order;

  // Create review
  const review = await Review.create({
    productId,
    userId,
    rating,
    comment: comment?.trim(),
    isVerifiedPurchase,
  });

  // Populate user details
  await review.populate("userId", "firstName lastName");

  // Update product rating and review count
  await updateProductRating(productId);

  res
    .status(201)
    .json(new ApiResponse(201, review, "Review created successfully"));
});

// Get reviews for a product
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const {
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "desc",
    rating,
  } = req.query;

  const skip = (page - 1) * limit;
  const sortOrder = order === "asc" ? 1 : -1;

  // Build filter query
  const filterQuery = { productId };
  if (rating) {
    filterQuery.rating = parseInt(rating);
  }

  const reviews = await Review.find(filterQuery)
    .populate("userId", "name") // Changed to correctly populate the name field
    .sort({ [sort]: sortOrder })
    .skip(skip)
    .limit(parseInt(limit));

  const totalReviews = await Review.countDocuments(filterQuery);

  // Calculate rating distribution for all reviews (not filtered)
  const ratingDistribution = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  const distribution = {};
  for (let i = 1; i <= 5; i++) {
    distribution[i] = 0;
  }
  ratingDistribution.forEach((item) => {
    distribution[item._id] = item.count;
  });

  // Calculate average rating for all reviews
  const avgRating = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, avgRating: { $avg: "$rating" } } },
  ]);

  const averageRating = avgRating.length > 0 ? avgRating[0].avgRating : 0;
  const totalAllReviews = await Review.countDocuments({ productId });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / limit),
          totalReviews,
          hasNext: page * limit < totalReviews,
          hasPrev: page > 1,
        },
        ratingDistribution: distribution,
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews: totalAllReviews,
      },
      "Reviews fetched successfully"
    )
  );
});

// Get user's review for a product
const getUserReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  const review = await Review.findOne({ productId, userId }).populate(
    "userId",
    "name"
  );

  if (!review) {
    return res.status(404).json(new ApiResponse(404, null, "Review not found"));
  }

  res
    .status(200)
    .json(new ApiResponse(200, review, "Review fetched successfully"));
});

// Update user's review
const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  if (rating && (rating < 1 || rating > 5)) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  const review = await Review.findOne({ _id: reviewId, userId });
  if (!review) {
    throw new ApiError(
      404,
      "Review not found or you don't have permission to edit"
    );
  }

  // Update review
  if (rating) review.rating = rating;
  if (comment !== undefined) review.comment = comment.trim();

  await review.save();
  await review.populate("userId", "firstName lastName");

  // Update product rating
  await updateProductRating(review.productId);

  res
    .status(200)
    .json(new ApiResponse(200, review, "Review updated successfully"));
});

// Delete user's review
const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  const review = await Review.findOne({ _id: reviewId, userId });
  if (!review) {
    throw new ApiError(
      404,
      "Review not found or you don't have permission to delete"
    );
  }

  const productId = review.productId;
  await Review.findByIdAndDelete(reviewId);

  // Update product rating
  await updateProductRating(productId);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Review deleted successfully"));
});

// Get all reviews by a user
const getUserReviews = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const reviews = await Review.find({ userId })
    .populate("productId", "name mainImage price")
    .populate("userId", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalReviews = await Review.countDocuments({ userId });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / limit),
          totalReviews,
          hasNext: page * limit < totalReviews,
          hasPrev: page > 1,
        },
      },
      "User reviews fetched successfully"
    )
  );
});

// Helper function to update product rating
const updateProductRating = async (productId) => {
  const result = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const avgRating = result.length > 0 ? result[0].avgRating : 0;
  const totalReviews = result.length > 0 ? result[0].totalReviews : 0;

  await Product.findByIdAndUpdate(productId, {
    rating: parseFloat(avgRating.toFixed(1)),
    totalReview: totalReviews,
  });
};

// Admin reply to review
const adminReplyToReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
    throw new ApiError(400, "Reply message is required");
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  review.adminReply = {
    message: message.trim(),
    repliedAt: new Date(),
  };

  await review.save();
  await review.populate("userId", "firstName lastName");

  res
    .status(200)
    .json(new ApiResponse(200, review, "Admin reply added successfully"));
});

// Get all reviews for admin
const getAllReviewsForAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;

  // Build filter query
  const filterQuery = {};
  if (status === "pending") {
    filterQuery.adminReply = { $exists: false };
  } else if (status === "replied") {
    filterQuery.adminReply = { $exists: true };
  }

  const reviews = await Review.find(filterQuery)
    .populate("userId", "firstName lastName")
    .populate("productId", "name mainImage")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalReviews = await Review.countDocuments(filterQuery);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / limit),
          totalReviews,
          hasNext: page * limit < totalReviews,
          hasPrev: page > 1,
        },
      },
      "Reviews fetched successfully for admin"
    )
  );
});

export {
  createReview,
  getProductReviews,
  getUserReview,
  updateReview,
  deleteReview,
  getUserReviews,
  adminReplyToReview,
  getAllReviewsForAdmin,
};
