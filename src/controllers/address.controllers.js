import { Address } from "../models/Address.model.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";

// Get user addresses
export const getUserAddresses = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const addresses = await Address.find({ userId }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  res
    .status(200)
    .json(new ApiResponse(200, addresses, "Addresses fetched successfully"));
});

// Add new address
export const addAddress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    fullname,
    phone,
    PinCode,
    streetAddress,
    city,
    State,
    landmark,
    AddressType,
    isDefault = false,
  } = req.body;

  // Validate required fields
  if (
    !fullname ||
    !phone ||
    !PinCode ||
    !streetAddress ||
    !city ||
    !State ||
    !AddressType
  ) {
    throw new ApiError(400, "All required fields must be provided");
  }

  // If this is set as default, remove default from other addresses
  if (isDefault) {
    await Address.updateMany({ userId }, { isDefault: false });
  }

  const address = await Address.create({
    userId,
    fullname,
    phone,
    PinCode,
    streetAddress,
    city,
    State,
    landmark,
    AddressType,
    isDefault,
  });

  res
    .status(201)
    .json(new ApiResponse(201, address, "Address added successfully"));
});

// Update address
export const updateAddress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { addressId } = req.params;
  const updateData = req.body;

  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  // If setting as default, remove default from other addresses
  if (updateData.isDefault) {
    await Address.updateMany(
      { userId, _id: { $ne: addressId } },
      { isDefault: false }
    );
  }

  const updatedAddress = await Address.findByIdAndUpdate(
    addressId,
    updateData,
    { new: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, updatedAddress, "Address updated successfully"));
});

// Delete address
export const deleteAddress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { addressId } = req.params;

  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  await Address.findByIdAndDelete(addressId);

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Address deleted successfully"));
});

// Set default address
export const setDefaultAddress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { addressId } = req.params;

  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  // Remove default from all addresses
  await Address.updateMany({ userId }, { isDefault: false });

  // Set new default
  address.isDefault = true;
  await address.save();

  res
    .status(200)
    .json(new ApiResponse(200, address, "Default address set successfully"));
});
