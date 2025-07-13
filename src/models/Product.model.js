import mongoose, { trusted } from "mongoose";


const VariantsSchema = {
    sku : String,
    attributes : Object,
    price :Number,
    stock : Number,
    images : [String],
    isDefault : {
        type : Boolean,
        default:true,
    }
}

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
    },
    slag: {
      type: String,
      unique: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    attributes: Object,
    variants: [VariantsSchema],
    price: {
      type: Number,
      default: 0,
      min: 0,
      
    },
    finalPrice: {
      type: Number,
      default: 0,
      min: 0,
     
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalStock: {
      type: Number,
      default: 0,
    },
    tags: [String],
    relatedProductIds: [{ type: mongoose.Schema.Types.ObjectId , ref: "Product" }],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    description: String,
    images: [String],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    seoTitle: String,
    seoDescription: String,
  },
  { timestamps: true }
);


export const Product = mongoose.model("Product" , ProductSchema);