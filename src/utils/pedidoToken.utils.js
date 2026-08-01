import crypto from "crypto";

// Token firmado (id + firma HMAC), no un valor aleatorio guardado en BD:
// no requiere migración ni almacenamiento — se recalcula y verifica al
// vuelo. Cambiar un solo caracter del id invalida la firma, así que no se
// puede adivinar el estado de otro pedido probando números consecutivos
// en la URL pública (a diferencia de exponer el idPedido plano).
const SECRET = process.env.JWT_SECRET || "cambiar-secreto";
const LARGO_FIRMA = 20;

const firmar = (idStr) =>
  crypto.createHmac("sha256", SECRET).update(idStr).digest("hex").slice(0, LARGO_FIRMA);

export function generarTokenPedido(idPedido) {
  const idStr = String(idPedido);
  return `${idStr}.${firmar(idStr)}`;
}

/** Devuelve el idPedido si el token es válido, o null si no lo es. */
export function verificarTokenPedido(token) {
  if (typeof token !== "string") return null;
  const [idStr, firma] = token.split(".");
  if (!idStr || !firma) return null;

  const idPedido = Number(idStr);
  if (!Number.isInteger(idPedido) || idPedido <= 0) return null;

  const esperada = firmar(idStr);
  const bufFirma = Buffer.from(firma);
  const bufEsperada = Buffer.from(esperada);
  if (bufFirma.length !== bufEsperada.length) return null;
  if (!crypto.timingSafeEqual(bufFirma, bufEsperada)) return null;

  return idPedido;
}
