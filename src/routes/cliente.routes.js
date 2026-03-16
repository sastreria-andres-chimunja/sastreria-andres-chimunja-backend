import { Router } from "express";
import * as clienteController from "../controllers/cliente.controller.js";

const router = Router();

router.get("/", clienteController.getClientes);

router.get("/search", clienteController.searchClientes);

router.get("/:id", clienteController.getClienteById);

router.post("/", clienteController.createCliente);

router.put("/:id", clienteController.updateCliente);

router.delete("/:id", clienteController.deleteCliente);

export default router;
