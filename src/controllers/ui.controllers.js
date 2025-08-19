import { asyncHandler } from "../util/asyncHandler.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { uploadCloudinary } from "../util/cloudinary.js";
import { Ui } from "../models/Ui.model.js";

export const uploadBanner = asyncHandler(async (req, res) => {
  try {
    // Check if files are present
    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, "No banner images provided");
    }

    const filesArray = req.files;
    const bannerUrls = [];

    // Upload each file to Cloudinary
    for (const file of filesArray) {
      const response = await uploadCloudinary(file.path);

      if (response && response.url) {
        bannerUrls.push(response.url);
      }
    }

    if (bannerUrls.length === 0) {
      throw new ApiError(500, "Failed to upload banner images");
    }

    // Update or create UI document with new banner URLs
    const uiDocument = await Ui.findOneAndUpdate(
      {}, // Find any document (assuming there's only one UI document)
      { $set: { homePageBanner: bannerUrls } },
      { new: true, upsert: true } // Return updated document, create if doesn't exist
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, uiDocument, "Banner images uploaded successfully")
      );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error uploading banner images"
    );
  }
});

// Get all banners
export const getBanners = asyncHandler(async (req, res) => {
  try {
    const uiDocument = await Ui.findOne({});

    if (!uiDocument) {
      return res
        .status(200)
        .json(new ApiResponse(200, { homePageBanner: [] }, "No banners found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { homePageBanner: uiDocument.homePageBanner },
          "Banners retrieved successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Error retrieving banners");
  }
});

// Add a single banner to existing ones
export const addBanner = asyncHandler(async (req, res) => {
  try {
    // Check if file is present
    if (!req.file) {
      throw new ApiError(400, "No banner image provided");
    }

    // Upload to Cloudinary
    const response = await uploadCloudinary(req.file.path);

    if (!response || !response.url) {
      throw new ApiError(500, "Failed to upload banner image");
    }

    // Update UI document, pushing new banner URL to the array
    const uiDocument = await Ui.findOneAndUpdate(
      {},
      { $push: { homePageBanner: response.url } },
      { new: true, upsert: true }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, uiDocument, "Banner image added successfully")
      );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error adding banner image"
    );
  }
});

// Delete a banner by URL
export const deleteBanner = asyncHandler(async (req, res) => {
  try {
    const { bannerUrl } = req.body;

    if (!bannerUrl) {
      throw new ApiError(400, "Banner URL is required");
    }

    // Remove the specified banner URL from the array
    const uiDocument = await Ui.findOneAndUpdate(
      {},
      { $pull: { homePageBanner: bannerUrl } },
      { new: true }
    );

    if (!uiDocument) {
      throw new ApiError(404, "UI configuration not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, uiDocument, "Banner deleted successfully"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error deleting banner"
    );
  }
});
