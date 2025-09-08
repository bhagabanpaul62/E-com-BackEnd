import { Wishlist } from "../models/Wishlist.model.js";
import { Product } from "../models/Product.model.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";

// Get user's wishlist
const getUserWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find user's wishlist and populate product details with all variant information
  const wishlist = await Wishlist.findOne({ userId }).populate({
    path: "products",
    select:
      "name images price discount totalStock category description rating slug brand variants mainImage mrpPrice status attributes",
  });

  if (!wishlist) {
    // If wishlist doesn't exist, return empty wishlist
    return res
      .status(200)
      .json(new ApiResponse(200, { products: [] }, "Wishlist is empty"));
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        products: wishlist.products,
      },
      "Wishlist fetched successfully"
    )
  );
});

// Add product to wishlist
const addToWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.body;

  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Check if product is active
  if (product.status !== "active") {
    throw new ApiError(400, "This product is not available");
  }

  // Find user's wishlist or create a new one
  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({
      userId,
      products: [],
    });
  }

  // Check if product is already in wishlist
  if (wishlist.products.includes(productId)) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Product is already in wishlist"));
  }

  // Add product to wishlist
  wishlist.products.push(productId);
  await wishlist.save();

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Product added to wishlist successfully"));
});

// Remove product from wishlist
const removeFromWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  // Find user's wishlist
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    throw new ApiError(404, "Wishlist not found");
  }

  // Remove product from wishlist
  wishlist.products = wishlist.products.filter(
    (id) => id.toString() !== productId
  );
  await wishlist.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, {}, "Product removed from wishlist successfully")
    );
});

// Clear wishlist
const clearWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find user's wishlist
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    throw new ApiError(404, "Wishlist not found");
  }

  // Clear wishlist
  wishlist.products = [];
  await wishlist.save();

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Wishlist cleared successfully"));
});

// Check if a product is in the wishlist
const checkWishlistItem = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  // Find user's wishlist
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isInWishlist: false },
          "Product is not in wishlist"
        )
      );
  }

  // Check if product is in wishlist
  const isInWishlist = wishlist.products.some(
    (id) => id.toString() === productId
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isInWishlist },
        isInWishlist ? "Product is in wishlist" : "Product is not in wishlist"
      )
    );
});

export {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkWishlistItem,
};
