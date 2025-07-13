import express from "express"
import { createCategory , getCategoryById , getAllCategories } from "../controllers/Category.controllers.js"

const router =express.Router()

router.post("/",createCategory);
router.get("/",getAllCategories);
router.get("/:id",getCategoryById);

export default router;