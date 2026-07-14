import { Router } from "express";
import * as limiteDiarioController from "../controllers/limiteDiario.controller.js";

const router = Router();

router.get("/", limiteDiarioController.getLimiteDiario);
router.put("/", limiteDiarioController.updateLimiteDiario);

export default router;
