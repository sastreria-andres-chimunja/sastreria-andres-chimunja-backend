import { Router } from "express";
import * as estadoController from "../controllers/estado.controller.js";

const router = Router();

router.get("/", estadoController.getEstados);
router.get("/:id", estadoController.getEstadoById);
router.post("/", estadoController.createEstado);
router.put("/:id", estadoController.updateEstado);
router.delete("/:id", estadoController.deleteEstado);

export default router;
