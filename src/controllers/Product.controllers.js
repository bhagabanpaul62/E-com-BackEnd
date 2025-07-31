import { Product } from "../models/Product.model.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";

import { uploadCloudinary as uploadToCloudinary } from "../util/cloudinary.js";

import { generateSlug } from "../util/slugify.js";

// CREATE PRODUCT

export const addProduct = asyncHandler(async (req, res) => {
  console.log("▶️ [START] addProduct called");
  console.log("📦 req.body keys:", Object.keys(req.body || {}));
  console.log("🖼️ req.files keys:", Object.keys(req.files || {}));

  if (!req.body?.product) {
    console.error("❌ Product data missing in req.body");
    throw new ApiError(400, "Product data is missing");
  }

  let productData;
  try {
    productData = JSON.parse(req.body.product);
    console.log("✅ Parsed product data:", productData);
  } catch (err) {
    console.error("❌ Failed to parse product JSON", err);
    throw new ApiError(400, "Invalid product JSON");
  }

  const files = req.files || {};

  // ▶️ Slug, SEO, etc.
  productData.slug = generateSlug(productData.name);
  productData.seoTitle = productData.name;
  productData.seoDescription =
    productData.seoDescription || productData.description?.slice(0, 160) || "";

  console.log("📄 Slug & SEO initialized");

  // ▶️ Handle main image
  console.log("image", files.productImage?.[0]);

const filesArray = Array.isArray(req.files) ? req.files : [];

const mainImageFile = filesArray.find(
  (file) => file.fieldname === "productImage"
);
console.log("🖼️ Found main image file:", mainImageFile?.originalname);

if (mainImageFile) {
  try {
    console.log("📤 Uploading main image to Cloudinary...");
    const mainImageResult = await uploadToCloudinary(mainImageFile.path);
    if (mainImageResult?.secure_url) {
      productData.mainImage = mainImageResult.secure_url;
      console.log("✅ Main image uploaded:", mainImageResult.secure_url);
    } else {
      console.warn("⚠️ Cloudinary returned no secure_url for main image");
    }
  } catch (err) {
    console.error("❌ Main image upload failed:", err);
    throw new ApiError(500, "Failed to upload main product image");
  }
} else {
  console.log("ℹ️ No main image provided in request");
}


  // ▶️ Handle variants and their images
  if (req.body.variants) {
    let variantsData;
    try {
      variantsData = JSON.parse(req.body.variants);
      console.log("✅ Parsed variants data:", variantsData);
    } catch (err) {
      console.error("❌ Failed to parse variants JSON:", err);
      throw new ApiError(400, "Invalid variants data");
    }

    // Organize variant files by their fieldnames
    const variantFilesMap = {};
    console.log("🔍 Processing files:", files);

    // Convert files object to array if it's not already
    const fileArray = Array.isArray(files)
      ? files
      : Object.values(files).flat();

    fileArray.forEach((file) => {
      console.log(`📝 Processing file:`, {
        fieldname: file.fieldname,
        originalname: file.originalname,
      });

      if (file.fieldname === "productImage") return; // Skip main product image

      // Extract variant index and image index from fieldname (e.g., "variant_0_1")
      const match = file.fieldname?.match(/^variant_(\d+)_(\d+)$/);
      if (!match) {
        console.log(
          `⚠️ Skipping file with invalid fieldname: ${file.fieldname}`
        );
        return;
      }

      const [_, variantIndex, imageIndex] = match;
      if (!variantFilesMap[variantIndex]) {
        variantFilesMap[variantIndex] = [];
      }
      variantFilesMap[variantIndex].push(file);
      console.log(`✅ Added image to variant ${variantIndex}`);
    });

    console.log(
      "📁 Organized variant files:",
      Object.keys(variantFilesMap).map(
        (key) => `Variant ${key}: ${variantFilesMap[key].length} images`
      )
    );

    const variantPromises = variantsData.map(async (variant, i) => {
      let variantImages = [];
      const variantFiles = variantFilesMap[i] || [];

      if (variantFiles.length > 0) {
        console.log(
          `📤 Uploading ${variantFiles.length} image(s) for variant_${i}`
        );
        const uploadPromises = variantFiles.map(async (file, fileIndex) => {
          try {
            const uploaded = await uploadToCloudinary(file.path);
            console.log(
              `✅ Uploaded variant_${i} image ${fileIndex}:`,
              uploaded.secure_url
            );
            return uploaded?.secure_url || null;
          } catch (err) {
            console.error(
              `❌ Upload failed for variant_${i} image ${fileIndex}:`,
              err
            );
            return null;
          }
        });

        variantImages = (await Promise.all(uploadPromises)).filter(Boolean);
      } else {
        console.log(`ℹ️ No images provided for variant_${i}`);
      }

      return {
        ...variant,
        images: variantImages,
        price: Number(variant.price) || 0,
        stock: Number(variant.stock) || 0,
      };
    });
    productData.variants = await Promise.all(variantPromises);
    console.log("✅ Processed all variants with images:", productData.variants);
  } else {
    console.log("ℹ️ No variants found in request body");
  }

  // ▶️ Calculate min price and total stock
  if (productData.variants?.length) {
    const validPrices = productData.variants
      .map((v) => v.price)
      .filter((p) => p > 0);
    productData.price = validPrices.length
      ? Math.min(...validPrices)
      : productData.price || 0;

    productData.totalStock = productData.variants.reduce(
      (sum, v) => sum + (v.stock || 0),
      0
    );
    console.log(`💰 Calculated min price: ₹${productData.price}`);
    console.log(`📦 Calculated total stock: ${productData.totalStock}`);
  }

  // ▶️ Calculate discount
  if (
    typeof productData.mrpPrice === "number" &&
    productData.mrpPrice > productData.price
  ) {
    productData.discount = Math.round(
      ((productData.mrpPrice - productData.price) / productData.mrpPrice) * 100
    );
  } else {
    productData.discount = 0;
  }
  console.log(`🎯 Final discount: ${productData.discount}%`);

  try {
    console.log("🛠️ Inserting product into database...");
    const newProduct = await Product.create(productData);
    console.log("✅ Product saved to database");

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { data: newProduct },
          "Product created successfully"
        )
      );
  } catch (err) {
    console.error("❌ Database error while creating product:", err);
    throw new ApiError(500, "Failed to create product in database");
  }
});

//edit product by id
export const editProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const productData = JSON.parse(req.body.product || "{}");
  const files = req.files;

  const existingProduct = await Product.findById(id);
  if (!existingProduct) throw new ApiError(404, "Product not found");

  // ✅ 1. Update simple fields
  const shallowFields = [
    "name",
    "categoryId",
    "price",
    "status",
    "tag",
    "isFeatured",
    "isNewArrival",
    "isTrending",
    "averageRating",
    "totalReview",
  ];
  shallowFields.forEach((field) => {
    if (productData[field] !== undefined) {
      existingProduct[field] = productData[field];
    }
  });

  // ✅ 2. Update deep/nested fields
  if (productData.shippingDetails)
    existingProduct.shippingDetails = productData.shippingDetails;

  if (productData.returnPolicy)
    existingProduct.returnPolicy = productData.returnPolicy;

  if (productData.seo) existingProduct.seo = productData.seo;

  if (productData.tags) existingProduct.tags = productData.tags;

  if (productData.relatedProducts)
    existingProduct.relatedProducts = productData.relatedProducts;

  // ✅ 3. Replace product images if new ones are uploaded
  if (files?.productImage) {
    const imageUrls = await Promise.all(
      files.productImage.map(async (file) => {
        const uploaded = await uploadToCloudinary(file.path);
        return uploaded.secure_url;
      })
    );
    existingProduct.images = imageUrls;
  }

  // ✅ 4. Update variants
  if (productData.variants && Array.isArray(productData.variants)) {
    const updatedVariants = await Promise.all(
      productData.variants.map(async (variant, i) => {
        let imageField = `variant_${i}`;
        let imageUrls = [];

        if (files[imageField]) {
          imageUrls = await Promise.all(
            files[imageField].map(async (file) => {
              const uploaded = await uploadToCloudinary(file.path);
              return uploaded.secure_url;
            })
          );
        }

        // Check if it's an update or a new variant
        if (variant._id) {
          const existing = existingProduct.variants.id(variant._id);
          if (existing) {
            existing.set({
              ...variant,
              images: imageUrls.length ? imageUrls : existing.images,
            });
            return existing;
          }
        }

        // If no _id or not found, it's a new variant
        return {
          ...variant,
          images: imageUrls,
        };
      })
    );

    // Remove variants that are not in the update
    const incomingIds = productData.variants
      .filter((v) => v._id)
      .map((v) => v._id.toString());

    existingProduct.variants = existingProduct.variants.filter((v) =>
      incomingIds.includes(v._id.toString())
    );

    // Merge new/updated variants
    updatedVariants.forEach((v) => {
      if (!v._id) {
        existingProduct.variants.push(v); // new variant
      }
    });
  }

  // ✅ 5. Save updated product
  await existingProduct.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, existingProduct, "Product updated successfully")
    );
});

//delete product by id
export const deleteById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await Product.findByIdAndDelete(id);

  if (!deleted) {
    throw new ApiError(404, "product is not found");
  }
  res.status(200).json(new ApiResponse(200, deleted, "product deleted"));
});

//view all products for admin GET
export const viewAllProductsInAdmin = asyncHandler(async (req, res) => {
  const product = await Product.find()
    .populate("categoryId")
    .populate("relatedProductIds");
  if (!product) {
    throw new ApiError(400, "products not found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, product, { message: "product is found" }));
});

//view products by id in admin GET
export const viewAllProductsByIdInAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(400, "product not found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

//USER CONTROLLER

//view all products for user GET
export const viewAllProductsInUser = asyncHandler(async (req, res) => {
  const product = await Product.find({
    status: "active",
    totalStock: { $gt: 0 },
  });

  res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

//view products by id in user GET
export const viewAllProductsById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findOne({
    _id: id,
    status: "active",
    totalStock: { $gt: 0 },
  });
  if (!product) {
    throw new ApiError(400, "product not found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});
