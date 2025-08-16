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
    enum: ["cm", "m", "in"],
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

const ProductDimensionSchema = new mongoose.Schema({
  height: Number,
  width: Number,
  length: Number,
  dimensionUnit: {
    type: String,
    enum: ["cm", "m", "in"],
    default: "cm",
  },
  weight: {
    type: Number,
  },
  weightUnit: {
    type: String,
    enum: ["kg", "g", "lb"],
    default: "kg",
  },
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
    isSale: {
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
    productDimension: ProductDimensionSchema,
  },
  { timestamps: true }
);

ProductSchema.pre("findOneAndUpdate", async function (next) {
  let update = this.getUpdate() || {};
  if (!update.$set) update.$set = {};

  // Extract price & mrpPrice from update
  let price = update.$set.price ?? update.price;
  let mrpPrice = update.$set.mrpPrice ?? update.mrpPrice;
  let variants = update.$set.variants ?? update.variants;

  // If needed values are missing, fetch from DB
  if (price === undefined || mrpPrice === undefined || variants === undefined) {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (price === undefined) price = docToUpdate.price;
    if (mrpPrice === undefined) mrpPrice = docToUpdate.mrpPrice;
    if (variants === undefined) variants = docToUpdate.variants || [];
  }

  // 1️⃣ Calculate discount
  if (
    typeof price === "number" &&
    typeof mrpPrice === "number" &&
    mrpPrice > 0
  ) {
    update.$set.discount = Math.round(((mrpPrice - price) / mrpPrice) * 100);
  }

  // 2️⃣ Calculate total stock
  if (Array.isArray(variants)) {
    const totalStock = variants.reduce(
      (sum, v) => sum + (typeof v.stock === "number" ? v.stock : 0),
      0
    );
    update.$set.totalStock = totalStock;
  }

  this.setUpdate(update);
  next();
});

ProductSchema.pre("save",function(next){
  if(Array.isArray(this.variants)){
    const totalStock = this.variants.reduce((sum,v) => (typeof v.stock == "number" ? v.stock : 0), 0);
     this.totalStock = totalStock;
  }
 next();
})

export const Product = mongoose.model("Product", ProductSchema);
