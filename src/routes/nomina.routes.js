import { Router } from "express";
import * as nominaController from "../controllers/nomina.controller.js";

const router = Router();

router.get("/", nominaController.getNominaGeneral);
router.get("/:idEmpleado", nominaController.getNominaEmpleado);

export default router;
