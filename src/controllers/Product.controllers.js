import { Product } from "../models/Product.model";
import { Category } from "../models/Category.model";
import { generateSlug } from "../util/slugify";

//CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    let product = { ...req.body };

    //generate slug
    if (!product.slag && product.name) {
      product.slag = generateSlug(product.name);
    }

    //Final Price fallback
    if (!product.finalPrice && product.price) {
      product.finalPrice = product.price;
    }

    //Calculate Discount
    if (
      product.price &&
      product.finalPrice &&
      product.finalPrice < product.price
    ) {
      product.discount = Math.round(
        ((product.price - product.finalPrice) / product.price) * 100
      );
    } else {
      product.discount = 0;
    }

    //Calculate Total Stock From Variants
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      product.stock = product.variants.reduce(
        (sum, v) => sum + (v.stock || 0),
        0
      );
    }
    const newProduct = await Product.create(product);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//GET ALL PRODUCTS 
export const getAllProducts = async(req,res)=>{
    try {
        const products = await Product.find().populate("Category","name slag")
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


//GET PRODUCTS BY SLUG
export const getProductsBySlug = async (req,res)=>{
    try {
    const product = await Product.findOne({slag : req.params.slag}).populate("categoryId", "name slug")
    if(!product){
        res.status(404).json({message : "product not found"});

    }
    res.json(products)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
