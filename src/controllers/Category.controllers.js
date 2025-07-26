import { Category } from "../models/Category.model.js";
import { generateSlug } from "../util/slugify.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";
import { uploadCloudinary } from "../util/cloudinary.js";



//CREATE PRODUCT CATEGORY
export const createCategory = asyncHandler(async (req, res) => {
  const { name, parentId, attributes, description, isFeatured } =
    req.body;

  if (!name) {
    throw new ApiError(400, "Image upload failed-*");
  }

  const slug = generateSlug(name);
  const categoryImageLocalPath = req.files?.categoryImage[0]?.path
  if(!categoryImageLocalPath){
    throw new ApiError(400,"not found Url")
  }
  const ImageUrl = await uploadCloudinary(categoryImageLocalPath);
  const category = await Category.create({
    name,
    slug,
    parentId,
    attributes,
    image : ImageUrl.url,
    description,
    isFeatured
});

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { data: category },
        { message: "category created successfully" }
      )
    );
});

//EDIT CATEGORY BY ID
export const editCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const update = req.body;

  const updateCategory = await Category.findByIdAndUpdate(
    id,
    {
      update,
    },
    { new: true }
  );

  if (!updateCategory) {
    throw new ApiError(400, "invalid id");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { data: Category },
        { message: "Category update successfully" }
      )
    );
});

//DELETE CATEGORY BY ID
export const deleteCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await Category.findByIdAndDelete(id);

  if (!deleted) {
    throw new ApiError(400, "Invalid category ID");
  }

  res
    .status(200)
    .json(new ApiResponse(200, deleted, "Category deleted successfully"));
});







//view category
export const viewAllCategory = asyncHandler(async(req,res)=>{
  const category = await Category.find();
  if(!category){
    throw new ApiError(400,"category not found")
  }
  res.status(200).json(new ApiResponse(200,{data : category},{message:"Category is found"} ))
})


//view category by id
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


