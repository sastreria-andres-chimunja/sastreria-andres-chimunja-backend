import { Router } from "express";
import * as itemPedidoController from "../controllers/itemPedido.controller.js";

const router = Router();

router.get("/", itemPedidoController.getItemsPedido);
// Specific sub-routes before generic /:id
router.get("/:id/pagos", itemPedidoController.getPagosItem);
router.put("/:id/pagar", itemPedidoController.pagarItemPedido);
router.post("/:id/registrar-pago", itemPedidoController.registrarPago);
router.get("/:id", itemPedidoController.getItemPedidoById);
router.post("/", itemPedidoController.createItemPedido);
router.put("/:id", itemPedidoController.updateItemPedido);
router.delete("/:id", itemPedidoController.deleteItemPedido);

export default router;
