import { Router } from "express";
import * as medidaController from "../controllers/medida.controller.js";

const router = Router();

router.get("/:id", medidaController.getMedidaById);
router.get("/byCustomer/:id", medidaController.getMedidasByClientId);

router.post("/", medidaController.createMedida);

router.put("/:id", medidaController.updateMedida);

router.delete("/:id", medidaController.deleteMedida);

export default router;
