import express from "express";
import ProductsCtrl from "../controllers/products.controller.js";

const router = express.Router();

router.get("/", ProductsCtrl.getProducts);
router.get("/:id", ProductsCtrl.getProductById);


export default router;
