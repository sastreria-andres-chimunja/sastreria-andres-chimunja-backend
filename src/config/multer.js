import multer from "multer";
import fs from "fs";
import path from "path";

const TIPOS_REFERENCIA_PERMITIDOS = ["itempedido", "medida"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tipoReferencia = (req.body.tipoReferencia || "").toLowerCase();

    if (!TIPOS_REFERENCIA_PERMITIDOS.includes(tipoReferencia)) {
      cb(new Error("tipoReferencia inválido"));
      return;
    }

    const folder = `uploads/${tipoReferencia}`;

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

export const upload = multer({ storage });
