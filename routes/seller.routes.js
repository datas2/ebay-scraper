import express from "express";
import SellerCtrl from "../controllers/seller.controller.js";

const router = express.Router();

router.get("/", SellerCtrl.getSellerProducts);

export default router;
