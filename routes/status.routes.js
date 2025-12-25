import express from "express";
import StatusCtrl from "../controllers/status.controller.js";

const router = express.Router();

router.get(["/", "/api"], StatusCtrl.getStatusApi);

export default router;
