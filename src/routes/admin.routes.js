import { Router } from "express";
import { dashBoard } from "../controllers/admin.controllers.js";
import {
  createCategory,
  deleteCategoryById,
  editCategoryById,
  viewAllCategory,
  viewCategoryById,
} from "../controllers/category.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import {
  addProduct,
  deleteById,
  editProductById,
  viewAllProductsById,
  viewAllProductsByIdInAdmin,
  viewAllProductsInAdmin,
  updateStatus,
  updatePrice,
  updateStock,
  updateVariantById,
  deleteVariantById,
} from "../controllers/product.controllers.js";
import {
  uploadBanner,
  getBanners,
  addBanner,
  deleteBanner,
} from "../controllers/ui.controllers.js";

const router = Router();

router.route("/dashboard").get(dashBoard);

//category creation and modification
router.route("/add-category").post(
  upload.fields([
    {
      name: "categoryImage",
      maxCount: 1,
    },
  ]),
  createCategory
);
router.route("/edit-category/:id").patch(
  upload.fields([
    {
      name: "categoryImage",
      maxCount: 1,
    },
  ]),
  editCategoryById
);
router.route("/delete-category/:id").delete(deleteCategoryById);
router.route("/category").get(viewAllCategory);
router.route("/category/:id").get(viewCategoryById);

//product creation and modification
router.route("/add-product").post(upload.any(), addProduct);
router.route("/edit-product/:id").patch(upload.any(), editProductById);
router.route("/delete-product/:id").delete(deleteById);
router.route("/edit-status/:id").patch(updateStatus);
router.route("/edit-price/:id").patch(updatePrice);
router.route("/edit-stock/:id").patch(updateStock);
router.route("/edit-variant/:variantId").patch(updateVariantById);
router.route("/delete-variant/:variantId").delete(deleteVariantById);
router.route("/view-products").get(viewAllProductsInAdmin);
router.route("/view-product-by-id/:id").get(viewAllProductsByIdInAdmin);

//admin banner management routes
router.route("/banners/update").post(upload.any(), uploadBanner);
router.route("/banners").get(getBanners);
router.route("/banners/add").post(upload.single("banner"), addBanner);
router.route("/banners/delete").delete(deleteBanner);

export default router;
