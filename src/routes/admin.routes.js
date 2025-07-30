import { Router } from "express";
import { dashBoard } from "../controllers/admin.controllers.js";
import { createCategory, deleteCategoryById, editCategoryById, viewAllCategory, viewCategoryById } from "../controllers/category.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { addProduct, deleteById, editProductById, viewAllProductsByIdInAdmin, viewAllProductsInAdmin,  } from "../controllers/product.controllers.js";

const router = Router();

router.route("/dashboard").get(dashBoard);

//category creation and modification 
router.route("/add-category").post(upload.fields([
    {
        name : "categoryImage",
        maxCount : 1,
    }
]),createCategory)
router.route("/edit-category/:id").patch(
  upload.fields([
    {
      name: "categoryImage",
      maxCount: 1,
    },
  ]),
  editCategoryById
);
router.route("/delete-category/:id").delete(deleteCategoryById)
router.route("/category").get(viewAllCategory);
router.route("/category/:id").get(viewCategoryById);



//product creation and modification 
router.route("/add-product").post(upload.any,addProduct);
router.route("/edit-product/:id").patch(upload.any(),editProductById);
router.route("/delete-product/:id").delete(deleteById);
router.route("/view-products").get(viewAllProductsInAdmin);
router.route("/view-product-by-id").get(viewAllProductsByIdInAdmin);



export default router;
