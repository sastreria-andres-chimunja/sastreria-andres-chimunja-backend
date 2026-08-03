import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRIVATE_KEY_PATH = path.join(__dirname, "..", "secrets", "qz-private-key.pem");

let privateKey = null;
try {
  privateKey = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");
} catch {
  // La llave no está presente (ej. entorno sin configurar todavía) — el
  // endpoint responde 500 explicando qué falta en vez de tumbar el server.
}

/**
 * POST /qz/firmar — firma los datos que QZ Tray exige para confiar en el
 * sitio sin mostrar el diálogo "Allow/Block" en cada conexión. La llave
 * privada vive solo en el servidor (src/secrets/qz-private-key.pem, fuera
 * de git) — el frontend nunca la ve, solo manda el string a firmar y recibe
 * la firma en base64.
 */
export const firmar = (req, res) => {
  if (!privateKey) {
    return res.status(500).json({
      error: "Llave privada de QZ Tray no configurada en el servidor (src/secrets/qz-private-key.pem).",
    });
  }
  const { toSign } = req.body;
  if (typeof toSign !== "string") {
    return res.status(400).json({ error: "Se requiere 'toSign' (string)" });
  }
  try {
    const firma = crypto.createSign("SHA512").update(toSign).sign(privateKey, "base64");
    res.json({ firma });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
