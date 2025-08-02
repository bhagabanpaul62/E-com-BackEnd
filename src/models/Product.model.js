import mongoose from "mongoose";

const VariantsSchema = new mongoose.Schema(
  {
    sku: String,
    attributes: Object,
    price: Number,
    stock: Number,

    images: [String],
    isDefault: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const ReturnPolicySchema = new mongoose.Schema({
  isReturnable: {
    type: Boolean,
    default: true,
  },
  isReturnDays: Number,
  isReturnCost: Number,
});

const ShippingDetailsSchema = new mongoose.Schema({
  weight: Number,
  weightUnit: {
    type: String,
    enum: ["kg", "g", "lb"],
    default: "kg",
  },
  height: Number,
  width: Number,
  depth: Number, // (optional)
  dimensionUnit: {
    type: String,
    enum: ["cm", "mm", "inch"],
    default: "cm",
  },
  shippingOption: [
    {
      shippingType: {
        type: String,
        enum: ["Express", "Normal"],
        default: "Normal",
      },
      cost: Number,
      estimatedDays: Number,
    },
  ],
});

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,

      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    asin: {
      type: String,
      trim: true,
    },
    attributes: Object,
    variants: [VariantsSchema],
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    mrpPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    mainImage: {
      type: String,
    },
    totalStock: {
      type: Number,
      default: 0,
    },
    tags: [String],
    relatedProductIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    ],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    description: String,

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    seoTitle: {
      type: String,
      default: function () {
        return this.name;
      },
    },
    seoDescription: {
      type: String,
      default: function () {
        return this.description;
      },
    },
    returnPolicy: ReturnPolicySchema,
    brand: String,
    warranty: {
      description: String,
      warrantyType: {
        type: String,
        enum: ["Brand", "Platform", "Seller"],
        default: "platform",
      },
      policy: String,
    },

    averageRating: {
      min: 0,
      max: 5,
      type: Number,
    },
    totalReview: {
      type: Number,
      min: 0,
    },
    shippingDetails: ShippingDetailsSchema,
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", ProductSchema);
