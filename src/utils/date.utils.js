/**
 * Parsea "dd/mm/yyyy" → "yyyy-mm-dd" para PostgreSQL.
 * Si ya viene en formato ISO o no tiene el formato esperado, devuelve null.
 */
export function parseFecha(ddMmYyyy) {
  if (!ddMmYyyy) return null;
  const parts = String(ddMmYyyy).split("/");
  if (parts.length !== 3) return null;
  const [dia, mes, anio] = parts;
  if (!dia || !mes || !anio) return null;
  return `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

/**
 * Dado un "yyyy-mm-dd" (típicamente el resultado de parseFecha para el
 * extremo "hasta" de un rango), devuelve el día siguiente en el mismo
 * formato — para usar con comparación "<" (exclusiva) en vez de "<=" al
 * filtrar columnas `timestamp` (con hora), donde "<= 'yyyy-mm-dd'" en
 * Postgres se interpreta como "<= yyyy-mm-dd 00:00:00" y termina
 * excluyendo silenciosamente casi todos los registros del propio día
 * "hasta" (cualquier hora después de medianoche). No hace falta para
 * columnas `date` (sin hora), donde "<=" ya es exacto.
 */
export function diaSiguiente(yyyyMmDd) {
  if (!yyyyMmDd) return null;
  const [anio, mes, dia] = yyyyMmDd.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia + 1));
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}-${String(fecha.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Formatea una fecha de PostgreSQL a "dd/mm/yyyy".
 * - Columnas `date` → pg las devuelve como string "yyyy-mm-dd"
 * - Columnas `timestamp` → pg las devuelve como objeto Date
 */
export function formatFecha(dbDate) {
  if (!dbDate) return null;

  if (typeof dbDate === "string") {
    const match = dbDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const [, anio, mes, dia] = match;
    return `${dia}/${mes}/${anio}`;
  }

  if (dbDate instanceof Date) {
    const dia = String(dbDate.getUTCDate()).padStart(2, "0");
    const mes = String(dbDate.getUTCMonth() + 1).padStart(2, "0");
    const anio = String(dbDate.getUTCFullYear());
    return `${dia}/${mes}/${anio}`;
  }

  return null;
}
