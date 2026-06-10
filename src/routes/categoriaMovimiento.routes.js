import { Router } from "express";
import * as categoriaMovimientoController from "../controllers/categoriaMovimiento.controller.js";

const router = Router();

router.get("/", categoriaMovimientoController.getCategoriasMovimiento);
router.get("/:id", categoriaMovimientoController.getCategoriaMovimientoById);

router.post("/", categoriaMovimientoController.createCategoriaMovimiento);

router.put("/:id", categoriaMovimientoController.updateCategoriaMovimiento);

router.delete("/:id", categoriaMovimientoController.deleteCategoriaMovimiento);

export default router;
