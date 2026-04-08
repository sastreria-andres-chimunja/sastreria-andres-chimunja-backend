import { Router } from "express";
import * as movimientoController from "../controllers/movimiento.controller.js";

const router = Router();

router.get("/", movimientoController.getMovimientos);
router.get("/:id", movimientoController.getMovimientoById);

router.post("/", movimientoController.createMovimiento);

router.put("/:id", movimientoController.updateMovimiento);

router.delete("/:id", movimientoController.deleteMovimiento);

export default router;
