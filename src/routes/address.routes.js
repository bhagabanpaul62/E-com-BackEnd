import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/address.controllers.js";

const router = Router();

// Secure all address routes with JWT authentication
router.use(verifyJwt);

// Address routes
router.get("/", getUserAddresses);
router.post("/", addAddress);
router.put("/:addressId", updateAddress);
router.delete("/:addressId", deleteAddress);
router.patch("/:addressId/default", setDefaultAddress);

export default router;
