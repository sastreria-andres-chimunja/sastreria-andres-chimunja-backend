import { Router } from "express";
import * as medidaController from "../controllers/medida.controller.js";

const router = Router();

router.get("/byCustomer/:id", medidaController.getMedidasByClientId);
router.get("/:id", medidaController.getMedidaById);

router.post("/", medidaController.createMedida);

router.put("/:id", medidaController.updateMedida);

router.delete("/:id", medidaController.deleteMedida);

export default router;
