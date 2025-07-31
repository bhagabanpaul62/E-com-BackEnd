import express from "express";
import {
  viewAllProductsById,
  viewAllProductsInUser,
} from "../controllers/duct.controllers.js";

const router = express.Router();

router.route("/").get(viewAllProductsInUser);
router.route("/:id").get(viewAllProductsById);

export default router;
