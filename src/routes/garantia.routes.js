import { Router } from "express";
import * as garantiaController from "../controllers/garantia.controller.js";

const router = Router();

router.get("/", garantiaController.listarGarantias);
router.post("/", garantiaController.createGarantia);
router.put("/:id/comision", garantiaController.actualizarComisionGarantia);

export default router;
