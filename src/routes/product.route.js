import express from "express"
import {createProduct , getAllProducts , getProductsBySlug} from "../controllers/Product.controllers.js"

const router = express.Router();

router.post("/",createProduct);
router.get("/",getAllProducts);
router.get("/:slug",getProductsBySlug);

export default router;