import { Category } from "../models/Category.model.js";
import { generateSlug } from "../util/slugify.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";
import { uploadCloudinary } from "../util/cloudinary.js";



//CREATE PRODUCT CATEGORY
export const createCategory = async (req, res) => {
  try {
    console.log("➡️ Incoming Form Body:", req.body);
    console.log("🖼 Uploaded Files:", req.files);

    const { name, parentId, attributes, description, isFeatured } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }

    const slug = generateSlug(name);

    
    
    const Featured = isFeatured === "true" || isFeatured === true;

    const categoryImageLocalPath = req.files?.categoryImage?.[0]?.path;
    if (!categoryImageLocalPath) {
      return res
        .status(400)
        .json({ success: false, message: "Category image is required" });
    }

    const ImageUrl = await uploadCloudinary(categoryImageLocalPath);
    if (!ImageUrl?.url) {
      return res
        .status(500)
        .json({ success: false, message: "Image upload failed" });
    }

    let parsedAttributes = [];
    try {
      parsedAttributes = attributes ? JSON.parse(attributes) : [];
    } catch (parseError) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid JSON in attributes" });
    }

    const newCategory = await Category.create({
      name,
      slug,
      parentId: parentId || null,
      description,
      image: ImageUrl.url,
      isFeatured: Featured,
      attributes: parsedAttributes,
    });

    return res.status(200).json({
      success: true,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    console.error("❌ Internal Server Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//EDIT CATEGORY BY ID
export const editCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { name, parentId, attributes, description, isFeatured } = req.body;

  let updatePayload = {};

  if (name) {
    updatePayload.name = name;
    updatePayload.slug = generateSlug(name);
  }

  if (description) updatePayload.description = description;
  if (parentId) updatePayload.parentId = parentId;
  if (typeof isFeatured !== "undefined") {
    updatePayload.isFeatured = isFeatured === "true" || isFeatured === true;
  }

  // Handle attributes parsing
  if (attributes) {
    try {
      updatePayload.attributes = JSON.parse(attributes);
    } catch (err) {
      throw new ApiError(400, "Invalid attributes JSON format");
    }
  }

  // Handle optional Cloudinary image upload
  const categoryImageLocalPath = req.files?.categoryImage?.[0]?.path;
  if (categoryImageLocalPath) {
    const uploadedImage = await uploadCloudinary(categoryImageLocalPath);
    if (!uploadedImage?.url) {
      throw new ApiError(500, "Image upload failed");
    }
    updatePayload.image = uploadedImage.url;
  }

  const updatedCategory = await Category.findByIdAndUpdate(id, updatePayload, {
    new: true,
  });

  if (!updatedCategory) {
    throw new ApiError(404, "Category not found");
  }

  return res.status(200).json(
    new ApiResponse(200, updatedCategory, {
      message: "Category updated successfully",
    })
  );
});

// DELETE CATEGORY BY ID (with cascading delete)
export const deleteCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if category exists
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(400, "Invalid category ID");
  }

  // Delete subcategories where parentId === this category's id
  await Category.deleteMany({ parentId: id });

  // Now delete the parent category
  const deleted = await Category.findByIdAndDelete(id);

  res
    .status(200)
    .json(new ApiResponse(200, deleted, "Category and subcategories deleted successfully"));
});








//view category admin
export const viewAllCategory = asyncHandler(async(req,res)=>{
  const category = await Category.find();
  if(!category){
    throw new ApiError(400,"category not found")
  }
  res.status(200).json(new ApiResponse(200,{data : category},{message:"Category is found"} ))
})


//view category by id in admin
export const viewCategoryById =asyncHandler(async(req,res)=>{
  const {id} = req.params;

  const category = await Category.findById(id)
  if (!category) {
    throw new ApiError(400, "category not found");
  }
  res.status(200).json(new ApiResponse(200,{data:category},{message :"select category by id"}))
})


//USER OPTIONS 
// User - View only featured categories
export const viewFeaturedCategoriesForUser = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isFeatured: true });

  if (!categories || categories.length === 0) {
    throw new ApiError(404, "No featured categories found");
  }

  res.status(200).json(
    new ApiResponse(200, { data: categories }, { message: "Featured categories fetched" })
  );
});

//user- view category by id
export const viewCategoryByIdFroUser =asyncHandler(async(req,res)=>{
  const {id} = req.params;

  const category = await Category.findOne({
    _id: id,
    isFeatured : true,
  });
  if (!category) {
    throw new ApiError(400, "category not found");
  }
  res.status(200).json(new ApiResponse(200,{data:category},{message :"select category by id"}))
})


