import { Router } from "express";
import * as rolController from "../controllers/rol.controller.js";

const router = Router();

router.get("/", rolController.getRoles);
router.get("/:id", rolController.getRolById);
router.get("/byName/:name", rolController.getRolByName);

router.post("/", rolController.createRol);

router.put("/:id", rolController.updateRol);

router.delete("/:id", rolController.deleteRol);

export default router;
