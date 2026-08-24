import { Router } from "express";
import * as pedidoController from "../controllers/pedido.controller.js";

const router = Router();

router.get("/", pedidoController.getPedidos);
// Rutas específicas antes de /:id
router.get("/valor-programado", pedidoController.getValorProgramado);
router.get("/publico/:token", pedidoController.getEstadoPublico);
router.get("/:id/abonos", pedidoController.getAbonosPedido);
router.post("/:id/registrar-abono", pedidoController.registrarAbonoPedido);
router.post("/:id/revertir-entregado", pedidoController.revertirPedidoEntregado);
router.get("/:id", pedidoController.getPedidoById);
router.post("/", pedidoController.createPedido);
router.put("/:id", pedidoController.updatePedido);
router.delete("/:id", pedidoController.deletePedido);

export default router;
