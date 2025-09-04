import { Cart } from "../models/Cart.model.js";
import { Product } from "../models/Product.model.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";

// Get user's cart
const getUserCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find user's cart and populate product details
  const cart = await Cart.findOne({ userId }).populate({
    path: "items.productId",
    select: "name mainImage price discountPercentage stock",
  });

  if (!cart) {
    // If cart doesn't exist, return empty cart
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { items: [], totalItems: 0, totalPrice: 0 },
          "Cart is empty"
        )
      );
  }

  // Calculate total price and item count
  let totalPrice = 0;
  let totalItems = 0;

  cart.items.forEach((item) => {
    totalPrice += item.priceAtAdd * item.quantity;
    totalItems += item.quantity;
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        items: cart.items,
        totalItems,
        totalPrice,
      },
      "Cart fetched successfully"
    )
  );
});

// Add item to cart
const addToCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity = 1, variantId } = req.body;

  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  // Check if product exists and get its price
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Check if product is in stock
  if (product.stock < quantity) {
    throw new ApiError(
      400,
      "Product is out of stock or not enough quantity available"
    );
  }

  // Calculate price after discount
  const finalPrice = product.discountPercentage
    ? product.price * (1 - product.discountPercentage / 100)
    : product.price;

  // Use the variant ID from request or default to product ID if not provided
  const finalVariantId = variantId || product._id;

  // Find user's cart or create a new one
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({
      userId,
      items: [],
    });
  }

  // Check if product is already in cart
  const existingItemIndex = cart.items.findIndex(
    (item) =>
      item.productId.toString() === productId &&
      item.variantId.toString() === finalVariantId.toString()
  );

  if (existingItemIndex > -1) {
    // Update quantity if product is already in cart
    cart.items[existingItemIndex].quantity += quantity;
    // Update price in case it has changed
    cart.items[existingItemIndex].priceAtAdd = finalPrice;
  } else {
    // Add new item to cart
    cart.items.push({
      productId,
      variantId: finalVariantId,
      quantity,
      priceAtAdd: finalPrice,
    });
  }

  await cart.save();

  // Recalculate totals
  let totalPrice = 0;
  let totalItems = 0;
  cart.items.forEach((item) => {
    totalPrice += item.priceAtAdd * item.quantity;
    totalItems += item.quantity;
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        items: cart.items,
        totalItems,
        totalPrice,
      },
      "Product added to cart successfully"
    )
  );
});

// Update item quantity in cart
const updateCartItem = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId, variantId, quantity } = req.body;

  if (!productId || !quantity) {
    throw new ApiError(400, "Product ID and quantity are required");
  }

  if (quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  // Check if product exists and is in stock
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (product.stock < quantity) {
    throw new ApiError(400, "Not enough stock available");
  }

  const finalVariantId = variantId || product._id;

  // Find user's cart
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  // Find the item in cart
  const itemIndex = cart.items.findIndex(
    (item) =>
      item.productId.toString() === productId &&
      item.variantId.toString() === finalVariantId.toString()
  );

  if (itemIndex === -1) {
    throw new ApiError(404, "Product not found in cart");
  }

  // Update quantity
  cart.items[itemIndex].quantity = quantity;

  await cart.save();

  // Recalculate totals
  let totalPrice = 0;
  let totalItems = 0;
  cart.items.forEach((item) => {
    totalPrice += item.priceAtAdd * item.quantity;
    totalItems += item.quantity;
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        items: cart.items,
        totalItems,
        totalPrice,
      },
      "Cart updated successfully"
    )
  );
});

// Remove item from cart
const removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId, variantId } = req.params;

  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  // Find user's cart
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const finalVariantId = variantId || productId;

  // Filter out the item to be removed
  const initialLength = cart.items.length;
  cart.items = cart.items.filter(
    (item) =>
      !(
        item.productId.toString() === productId &&
        item.variantId.toString() === finalVariantId
      )
  );

  if (cart.items.length === initialLength) {
    throw new ApiError(404, "Product not found in cart");
  }

  await cart.save();

  // Recalculate totals
  let totalPrice = 0;
  let totalItems = 0;
  cart.items.forEach((item) => {
    totalPrice += item.priceAtAdd * item.quantity;
    totalItems += item.quantity;
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        items: cart.items,
        totalItems,
        totalPrice,
      },
      "Product removed from cart successfully"
    )
  );
});

// Clear cart
const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find user's cart
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  // Clear cart items
  cart.items = [];
  await cart.save();

  res.status(200).json(
    new ApiResponse(
      200,
      {
        items: [],
        totalItems: 0,
        totalPrice: 0,
      },
      "Cart cleared successfully"
    )
  );
});

export { getUserCart, addToCart, updateCartItem, removeFromCart, clearCart };
