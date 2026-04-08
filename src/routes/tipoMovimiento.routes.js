import { Router } from "express";
import * as tipoMovimientoController from "../controllers/tipoMovimiento.controller.js";

const router = Router();

router.get("/", tipoMovimientoController.getTiposMovimiento);
router.get("/:id", tipoMovimientoController.getTipoMovimientoById);

router.post("/", tipoMovimientoController.createTipoMovimiento);

router.put("/:id", tipoMovimientoController.updateTipoMovimiento);

router.delete("/:id", tipoMovimientoController.deleteTipoMovimiento);

export default router;
