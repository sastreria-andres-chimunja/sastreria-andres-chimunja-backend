import multer from "multer";
import fs from "fs";
import path from "path";
import mime from "mime-types";

const TIPOS_REFERENCIA_PERMITIDOS = ["itempedido", "medida"];
const EXTENSIONES_IMAGEN_VALIDAS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif", ".bmp"]);

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
    // Algunas cámaras móviles (sobre todo al capturar directo con el botón
    // "Tomar foto", vía el atributo capture) devuelven un originalname sin
    // extensión reconocible -- a veces solo un número. Si eso pasa, Express
    // sirve el archivo estático sin poder adivinar su Content-Type real, y
    // el navegador no lo muestra como imagen aunque el archivo sí se haya
    // guardado bien. Se usa la extensión real según el mimetype (que el
    // navegador sí reporta bien) cuando la del nombre no es válida.
    const original = file.originalname || "foto";
    const extOriginal = path.extname(original).toLowerCase();
    const extValida = EXTENSIONES_IMAGEN_VALIDAS.has(extOriginal);
    const ext = extValida ? extOriginal : `.${mime.extension(file.mimetype) || "jpg"}`;
    const base = extValida ? original.slice(0, -extOriginal.length) : original;
    const uniqueName = `${Date.now()}-${base}${ext}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({ storage });
