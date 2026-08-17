import { Router } from "express";
import * as nominaController from "../controllers/nomina.controller.js";

const router = Router();

router.get("/", nominaController.getNominaGeneral);
router.post("/:idEmpleado/liquidar", nominaController.liquidarNomina);
router.get("/:idEmpleado/periodo", nominaController.getResumenPeriodo);
router.get("/:idEmpleado", nominaController.getNominaEmpleado);

export default router;
