import { Router } from "express";
import { login, actualizarClave, cambiarClaveInicial, recuperarClave } from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", login);
router.post("/recuperar", recuperarClave);
router.put("/cambiar-clave", actualizarClave);
router.put("/cambiar-clave-inicial", cambiarClaveInicial);

export default router;
