import express from "express";
import {
  viewAllCategory,
  viewCategoryById,
  viewCategoryByIdFroUser,
  viewFeaturedCategoriesForUser,
} from "../controllers/gory.controllers.js";

const router = express.Router();

router.route("/").get(viewFeaturedCategoriesForUser);
router.route("/:id").get(viewCategoryByIdFroUser);

export default router;
