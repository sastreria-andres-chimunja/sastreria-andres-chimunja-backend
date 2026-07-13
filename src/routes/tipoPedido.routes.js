import { Router } from "express";
import * as tipoPedidoController from "../controllers/tipoPedido.controller.js";

const router = Router();

router.get("/", tipoPedidoController.getTiposPedido);
router.get("/:id", tipoPedidoController.getTipoPedidoById);

export default router;
