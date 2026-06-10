import { Router } from "express";
import * as pedidoController from "../controllers/pedido.controller.js";

const router = Router();

router.get("/", pedidoController.getPedidos);
router.get("/:id", pedidoController.getPedidoById);
router.post("/", pedidoController.createPedido);
router.put("/:id", pedidoController.updatePedido);
router.delete("/:id", pedidoController.deletePedido);

export default router;
