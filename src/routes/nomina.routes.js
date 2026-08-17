import { Router } from "express";
import * as nominaController from "../controllers/nomina.controller.js";

const router = Router();

router.get("/", nominaController.getNominaGeneral);
router.post("/:idEmpleado/liquidar", nominaController.liquidarNomina);
router.get("/:idEmpleado/facturado", nominaController.getFacturadoDiario);
router.get("/:idEmpleado", nominaController.getNominaEmpleado);

export default router;
