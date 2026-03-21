import express from "express";
import * as imagenController from "../controllers/imagenes.controller.js";
import { upload } from "../config/multer.js";

const router = express.Router();

router.get("/", imagenController.getImagenes);
router.get("/:idImagen", imagenController.getImagenById);

router.post(
  "/upload",
  upload.array("imagenes", 5),
  imagenController.uploadImagen,
);

router.delete("/:id", imagenController.deleteImagen);

export default router;
