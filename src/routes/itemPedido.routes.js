import { Router } from "express";
import * as itemPedidoController from "../controllers/itemPedido.controller.js";

const router = Router();

router.get("/", itemPedidoController.getItemsPedido);
router.get("/:id", itemPedidoController.getItemPedidoById);
router.post("/", itemPedidoController.createItemPedido);
router.put("/:id", itemPedidoController.updateItemPedido);
router.delete("/:id", itemPedidoController.deleteItemPedido);

export default router;
