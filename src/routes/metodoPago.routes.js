import { Router } from "express";
import * as metodoPagoController from "../controllers/metodoPago.controller.js";

const router = Router();

router.get("/", metodoPagoController.getMetodosPago);
router.get("/:id", metodoPagoController.getMetodoPagoById);

router.post("/", metodoPagoController.createMetodoPago);

router.put("/:id", metodoPagoController.updateMetodoPago);

router.delete("/:id", metodoPagoController.deleteMetodoPago);

export default router;
