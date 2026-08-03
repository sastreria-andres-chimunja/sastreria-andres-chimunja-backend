import { Router } from "express";
import { firmar } from "../controllers/qz.controller.js";

const router = Router();

router.post("/firmar", firmar);

export default router;
