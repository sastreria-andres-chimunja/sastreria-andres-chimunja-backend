import { Router } from "express";
import * as empleadoController from "../controllers/empleado.controller.js";

const router = Router();

router.get("/", empleadoController.getEmpleados);
router.get("/:id", empleadoController.getEmpleadoById);

router.post("/", empleadoController.createEmpleado);

router.put("/:id", empleadoController.updateEmpleado);

router.delete("/:id", empleadoController.deleteEmpleado);

export default router;
