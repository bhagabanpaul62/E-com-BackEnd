import { Product } from "../models/Product.model.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";
import { uploadCloudinary } from "../util/cloudinary.js";
import { generateSlug } from "../util/slugify.js";

// CREATE PRODUCT
export const addProduct = asyncHandler(async (req, res) => {
  const product = JSON.parse(req.body.product);
  const files = req.files; // multer parses images here

  product.slug = generateSlug(product.name);

  // Loop over variants and attach their uploaded image
  product.variants = await Promise.all(
    product.variants.map(async (variant, i) => {
      const imageFile = files.find((f) => f.fieldname === `variant_${i}`);
      let imageUrl = "";

      if (imageFile) {
        const uploaded = await uploadCloudinary(imageFile.path); // your cloud logic
        imageUrl = uploaded.secure_url;
      }

      return {
        ...variant,
        images: imageUrl ? [imageUrl] : [],
        price: variant.price || 0,
      };
    })
  );

  // Product price = min(variant prices)
  const prices = product.variants.map((v) => v.price).filter((p) => p > 0);
  product.price = prices.length ? Math.min(...prices) : 0;

  // Discount logic based on product-level MRP and price
  if (
    typeof product.mrpPrice === "number" &&
    typeof product.price === "number" &&
    product.mrpPrice > product.price
  ) {
    product.discount = Math.round(
      ((product.mrpPrice - product.price) / product.mrpPrice) * 100
    );
  } else {
    product.discount = 0;
  }

  // Total stock
  product.totalStock = product.variants.reduce(
    (sum, v) => sum + (v.stock || 0),
    0
  );

  const newProduct = await Product.create(product);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { data: newProduct },
        { message: "Product created successfully" }
      )
    );
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
export const deleteById = asyncHandler(async(req,res)=>{
  const {id} = req.params;
  const deleted = await Product.findByIdAndDelete(id)

  if (!deleted){
    throw new ApiError(404,"product is not found")

  }
  res.status(200).json(new ApiResponse(200,deleted,"product deleted"))
}) ;


//view all products for admin GET
export const viewAllProductsInAdmin = asyncHandler(async(req,res)=>{
  const product = await Product.find()
  if(!product){
    throw new ApiError(400,"products not found")
  }
  res.status(200).json(new ApiResponse(200,product,{message : "product is found"}))
})

//view products by id in admin GET
export const viewAllProductsByIdInAdmin = asyncHandler(async(req,res)=>{
  const {id} = req.params;
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(400, "product not found");
  }
   res
     .status(200)
     .json(new ApiResponse(200, product, "Product fetched successfully"));

})

//USER CONTROLLER  

//view all products for user GET
export const viewAllProductsInUser = asyncHandler(async(req,res)=>{
  const product = await Product.find({
    status:"active",
    totalStock:{ $gt : 0 },
  });

  res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
})

//view products by id in user GET
export const viewAllProductsById = asyncHandler(async(req,res)=>{
  const {id} = req.params;
  const product = await Product.findOne({
    _id: id,
    status: "active",
    totalStock: { $gt: 0 },
  });
  if(!product){
    throw new ApiError(400,"product not found")
  }
  res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
})

