import { Router } from "express";
import { login, actualizarClave } from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", login);
router.put("/cambiar-clave", actualizarClave);

export default router;
