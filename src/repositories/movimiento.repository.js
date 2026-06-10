import db from "../config/database.js";
import { parseFecha, formatFecha } from "../utils/date.utils.js";

const TABLE = "movimiento";

const formatMovimiento = (m) =>
  m ? { ...m, fecha: formatFecha(m.fecha) } : null;

export const getMovimientoById = async (idMovimiento) => {
  const m = await db(TABLE).where({ idMovimiento }).first();
  return formatMovimiento(m);
};

export const getMovimientosByEmpleado = async (idReferencia) => {
  const m = await db(TABLE)
    .where({ idReferencia, tipoReferencia: "Nómina" })
    .first();
  return formatMovimiento(m);
};

export const getMovimientosByItem = async (idReferencia) => {
  const m = await db(TABLE)
    .where({ idReferencia, tipoReferencia: "Ventas" })
    .first();
  return formatMovimiento(m);
};

export const getMovimientos = async (fechaInicio, fechaFin) => {
  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);

  let query = db(TABLE).orderBy("fecha", "desc");
  if (desde) query = query.where("fecha", ">=", desde);
  if (hasta) query = query.where("fecha", "<=", hasta);

  const movimientos = await query;
  return movimientos.map(formatMovimiento);
};

export const createMovimiento = async (movimiento) => {
  const data = {
    ...movimiento,
    fecha: parseFecha(movimiento.fecha),
  };
  const [newMovimiento] = await db(TABLE).insert(data).returning("*");
  return formatMovimiento(newMovimiento);
};

export const updateMovimiento = async (idMovimiento, movimiento) => {
  const data = {
    ...movimiento,
    fecha: parseFecha(movimiento.fecha),
  };
  const [updated] = await db(TABLE)
    .where({ idMovimiento })
    .update(data)
    .returning("*");
  return formatMovimiento(updated);
};

export const deleteMovimiento = async (idMovimiento) => {
  return db(TABLE).where({ idMovimiento }).del();
};
